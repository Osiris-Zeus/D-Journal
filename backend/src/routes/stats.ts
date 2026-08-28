import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

function toISODate(d: Date) { return d.toISOString().split('T')[0]; }

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const projectId = req.query.projectId as string | undefined;
    const where: any = { userId: req.user!.id, status: 'CLOSED' };
    if (projectId) where.projectId = projectId;

    const trades = await prisma.trade.findMany({ where, orderBy: { date: 'asc' } });
    const projects = await prisma.project.findMany({ where: { userId: req.user!.id } });

    // Totals
    const totalTrades = trades.length;
    const wins = trades.filter(t => (t.pnl ?? 0) > 0).length;
    const losses = trades.filter(t => (t.pnl ?? 0) < 0).length;
    const breakeven = totalTrades - wins - losses;
    const winRate = totalTrades ? (wins / totalTrades) * 100 : 0;
    const totalPnL = trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const totalCharges = trades.reduce((s, t) => s + (t.charges ?? 0), 0);
    const avgWin = wins ? trades.filter(t => (t.pnl ?? 0) > 0).reduce((s, t) => s + (t.pnl ?? 0), 0) / wins : 0;
    const avgLoss = losses ? trades.filter(t => (t.pnl ?? 0) < 0).reduce((s, t) => s + (t.pnl ?? 0), 0) / losses : 0;
    const profitFactor = avgLoss !== 0 ? Math.abs((avgWin * wins) / (avgLoss * losses)) : (wins > 0 ? 999 : 0);
    const bestTrade = trades.length ? Math.max(...trades.map(t => t.pnl ?? 0)) : 0;
    const worstTrade = trades.length ? Math.min(...trades.map(t => t.pnl ?? 0)) : 0;

    // Balance per project
    const projectsWithBalance = projects.map(p => {
      const pt = trades.filter(t => t.projectId === p.id);
      const pnl = pt.reduce((s, t) => s + (t.pnl ?? 0), 0);
      return { id: p.id, name: p.name, startingBalance: p.startingBalance, currentBalance: p.startingBalance + pnl, pnl, color: p.color };
    });
    const selectedProject = projectId
      ? projectsWithBalance.find(p => p.id === projectId)
      : undefined;

    const totalBalance = selectedProject
      ? selectedProject.currentBalance
      : projectsWithBalance.reduce((s, p) => s + p.currentBalance, 0);

    const startingBalanceTotal = selectedProject
      ? selectedProject.startingBalance
      : projects.reduce((s, p) => s + p.startingBalance, 0);

    // Daily / Weekly / Monthly PnL
    const dailyMap = new Map<string, number>();
    const weeklyMap = new Map<string, number>();
    const monthlyMap = new Map<string, number>();
    trades.forEach(t => {
      const d = new Date(t.date);
      const dayKey = toISODate(d);
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + (t.pnl ?? 0));
      // weekly: ISO week
      const jan4 = new Date(d.getFullYear(), 0, 4);
      const dayOfWeek = (jan4.getDay() + 6) % 7;
      const weekStart = new Date(jan4);
      weekStart.setDate(jan4.getDate() - dayOfWeek + (Math.floor((d.getTime() - jan4.getTime()) / 86400000 / 7) * 7));
      const weekKey = toISODate(weekStart);
      weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + (t.pnl ?? 0));
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + (t.pnl ?? 0));
    });

    const daily = Array.from(dailyMap.entries()).map(([date, pnl]) => ({ date, pnl })).sort((a, b) => a.date.localeCompare(b.date));
    const weekly = Array.from(weeklyMap.entries()).map(([date, pnl]) => ({ date, pnl })).sort((a, b) => a.date.localeCompare(b.date));
    const monthly = Array.from(monthlyMap.entries()).map(([date, pnl]) => ({ date, pnl })).sort((a, b) => a.date.localeCompare(b.date));

    // Equity curve
    let equity = startingBalanceTotal;
    const equityCurve = daily.map(d => {
      equity += d.pnl;
      return { date: d.date, equity: Math.round(equity * 100) / 100 };
    });

    // By market & strategy
    const byMarket = Object.entries(
      trades.reduce((acc: any, t) => { acc[t.market] = (acc[t.market] || 0) + (t.pnl ?? 0); return acc; }, {})
    ).map(([market, pnl]) => ({ market, pnl: pnl as number, count: trades.filter(t => t.market === market).length }));

    const byStrategy = Object.entries(
      trades.reduce((acc: any, t) => { const k = t.strategy || 'No Strategy'; acc[k] = (acc[k] || 0) + (t.pnl ?? 0); return acc; }, {})
    ).map(([strategy, pnl]) => ({ strategy, pnl: pnl as number, count: trades.filter(t => (t.strategy || 'No Strategy') === strategy).length }));

    const recentTrades = await prisma.trade.findMany({ where: { userId: req.user!.id }, orderBy: { date: 'desc' }, take: 5, include: { project: { select: { name: true } } } });

    res.json({
      overview: { totalTrades, wins, losses, breakeven, winRate: Math.round(winRate * 10) / 10, totalPnL: Math.round(totalPnL * 100) / 100, totalCharges, avgWin: Math.round(avgWin * 100) / 100, avgLoss: Math.round(avgLoss * 100) / 100, profitFactor: Math.round(profitFactor * 100) / 100, bestTrade, worstTrade, totalBalance: Math.round(totalBalance * 100) / 100, startingBalanceTotal },
      projects: projectsWithBalance,
      daily, weekly, monthly, equityCurve, byMarket, byStrategy, recentTrades,
    });
  } catch (e) { next(e); }
});

export default router;
