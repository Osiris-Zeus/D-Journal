import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const projectSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(300).optional().nullable(),
  market: z.string().max(30).optional().nullable(),
  startingBalance: z.number().min(0),
  currency: z.string().min(1).max(10).default('USD'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { trades: true } },
      },
    });

    // compute balance per project
    const withStats = await Promise.all(projects.map(async (p) => {
      const trades = await prisma.trade.findMany({ where: { projectId: p.id, status: 'CLOSED' }, select: { pnl: true, charges: true } });
      const totalPnL = trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
      const totalCharges = trades.reduce((s, t) => s + (t.charges ?? 0), 0);
      const currentBalance = p.startingBalance + totalPnL - totalCharges;
      return { ...p, totalPnL, currentBalance, tradeCount: p._count.trades };
    }));

    res.json(withStats);
  } catch (e) { next(e); }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = projectSchema.parse(req.body);
    const exists = await prisma.project.findFirst({ where: { userId: req.user!.id, name: data.name } });
    if (exists) return res.status(409).json({ error: 'Project name already exists' });
    const project = await prisma.project.create({
      data: { ...data, description: data.description || undefined, market: data.market || undefined, userId: req.user!.id, color: data.color || '#6366f1' },
    });
    res.status(201).json(project);
  } catch (e) { next(e); }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (e) { next(e); }
});

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const data = projectSchema.partial().parse(req.body);
    const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const updated = await prisma.project.update({ where: { id: project.id }, data: { ...data } });
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await prisma.project.delete({ where: { id: project.id } });
    res.json({ message: 'Project deleted' });
  } catch (e) { next(e); }
});

export default router;
