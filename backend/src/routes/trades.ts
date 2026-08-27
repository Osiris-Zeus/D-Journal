import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const tradeSchema = z.object({
  projectId: z.string().cuid(),
  date: z.string().or(z.date()).transform(v => new Date(v)),
  market: z.string().min(1).max(30),
  instrument: z.string().min(1).max(30),
  side: z.enum(['BUY', 'SELL']),
  entryPrice: z.number().positive(),
  exitPrice: z.number().positive().nullable().optional(),
  quantity: z.number().positive(),
  stopLoss: z.number().positive().nullable().optional(),
  target: z.number().positive().nullable().optional(),
  charges: z.number().min(0).default(0),
  strategy: z.string().max(50).nullable().optional(),
  emotions: z.string().max(50).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  status: z.enum(['OPEN', 'CLOSED']).default('OPEN'),
  screenshots: z.array(z.string()).default([]),
});

function computePnL(data: any) {
  if (data.exitPrice == null || data.entryPrice == null) return { pnl: null, pnlPercent: null, status: 'OPEN' as const };
  const qty = data.quantity;
  const pnlRaw = data.side === 'BUY' ? (data.exitPrice - data.entryPrice) * qty : (data.entryPrice - data.exitPrice) * qty;
  const charges = data.charges ?? 0;
  const pnl = pnlRaw - charges;
  const pnlPercent = data.entryPrice ? (pnl / (data.entryPrice * qty)) * 100 : 0;
  return { pnl, pnlPercent, status: 'CLOSED' as const };
}

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { projectId, search, market, instrument, side, status, strategy, from, to, sortBy = 'date', sortOrder = 'desc', page = '1', limit = '50' } = req.query as any;
    const where: any = { userId: req.user!.id };
    if (projectId) where.projectId = projectId;
    if (market) where.market = market;
    if (instrument) where.instrument = { contains: instrument, mode: 'insensitive' };
    if (side) where.side = side;
    if (status) where.status = status;
    if (strategy) where.strategy = strategy;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    if (search) {
      where.OR = [
        { instrument: { contains: search, mode: 'insensitive' } },
        { market: { contains: search, mode: 'insensitive' } },
        { strategy: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orderBy: any = {};
    const allowedSort = ['date', 'pnl', 'createdAt', 'instrument', 'entryPrice'];
    orderBy[allowedSort.includes(sortBy) ? sortBy : 'date'] = sortOrder === 'asc' ? 'asc' : 'desc';

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({ where, orderBy, skip, take: parseInt(limit), include: { project: { select: { name: true, color: true } } } }),
      prisma.trade.count({ where }),
    ]);
    res.json({ trades, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { next(e); }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const trade = await prisma.trade.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    res.json(trade);
  } catch (e) { next(e); }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = tradeSchema.parse(req.body);
    // verify project belongs to user
    const project = await prisma.project.findFirst({ where: { id: data.projectId, userId: req.user!.id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { pnl, pnlPercent, status } = computePnL(data);
    const trade = await prisma.trade.create({
      data: {
        userId: req.user!.id,
        projectId: data.projectId,
        date: data.date,
        market: data.market,
        instrument: data.instrument,
        side: data.side,
        entryPrice: data.entryPrice,
        exitPrice: data.exitPrice ?? null,
        quantity: data.quantity,
        stopLoss: data.stopLoss ?? null,
        target: data.target ?? null,
        charges: data.charges ?? 0,
        strategy: data.strategy || null,
        emotions: data.emotions || null,
        notes: data.notes || null,
        status: pnl !== null ? status : data.status,
        pnl,
        pnlPercent,
        screenshots: data.screenshots || [],
      },
    });
    res.status(201).json(trade);
  } catch (e) { next(e); }
});

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.trade.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!existing) return res.status(404).json({ error: 'Trade not found' });
    const parsed = tradeSchema.partial().parse(req.body);
    const merged: any = { ...existing, ...parsed };
    const { pnl, pnlPercent, status } = computePnL(merged);
    const updated = await prisma.trade.update({
      where: { id: existing.id },
      data: {
        ...parsed,
        date: parsed.date ? new Date(parsed.date as any) : undefined,
        pnl,
        pnlPercent,
        status: pnl !== null ? status : (parsed.status as any) || existing.status,
      },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.trade.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!existing) return res.status(404).json({ error: 'Trade not found' });
    await prisma.trade.delete({ where: { id: existing.id } });
    res.json({ message: 'Trade deleted' });
  } catch (e) { next(e); }
});

router.get('/export/csv', async (req: AuthRequest, res, next) => {
  try {
    const projectId = req.query.projectId as string | undefined;
    const where: any = { userId: req.user!.id };
    if (projectId) where.projectId = projectId;
    const trades = await prisma.trade.findMany({ where, orderBy: { date: 'desc' } });
    const header = 'Date,Market,Instrument,Side,Entry,Exit,Qty,StopLoss,Target,Charges,PNL,PNL%,Strategy,Emotions,Status,Notes\n';
    const rows = trades.map(t => [
      t.date.toISOString().split('T')[0],
      t.market, t.instrument, t.side, t.entryPrice, t.exitPrice ?? '', t.quantity, t.stopLoss ?? '', t.target ?? '', t.charges, t.pnl ?? '', t.pnlPercent?.toFixed(2) ?? '', t.strategy ?? '', t.emotions ?? '', t.status, `"${(t.notes || '').replace(/"/g, '""')}"`
    ].join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="d-journal-trades.csv"');
    res.send(header + rows);
  } catch (e) { next(e); }
});

export default router;
