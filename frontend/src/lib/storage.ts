// Local fallback so app works without backend (and syncs when online)
const KEY = 'djournal_fallback_v1';
type Store = { projects: any[]; trades: any[]; analyses: any[]; };
const defaults: Store = { projects: [], trades: [], analyses: [] };

export const fallback = {
  load(): Store {
    try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : structuredClone(defaults); } catch { return structuredClone(defaults); }
  },
  save(s: Store) { localStorage.setItem(KEY, JSON.stringify(s)); },
  reset() { localStorage.removeItem(KEY); }
};

// small seed so dashboard is not empty on first run (demo data)
export function seedIfEmpty() {
  const s = fallback.load();
  if (s.projects.length) return;
  const pId = 'demo-proj-1';
  s.projects = [
    { id: pId, name: 'My Portfolio', description: 'Default portfolio', startingBalance: 100000, currency: 'USD', color: '#6366f1', createdAt: new Date().toISOString() },
    { id: 'demo-proj-2', name: 'Crypto Lab', description: 'BTC/ETH experiments', startingBalance: 25000, currency: 'USD', color: '#06b6d4', createdAt: new Date().toISOString() },
  ];
  const today = new Date();
  const mk = (daysAgo: number, over: any) => {
    const d = new Date(today); d.setDate(d.getDate()-daysAgo);
    return { id: `t${daysAgo}${Math.random().toString(36).slice(2,5)}`, projectId: pId, date: d.toISOString(), market: over.market, instrument: over.instrument, side: over.side, entryPrice: over.entry, exitPrice: over.exit, quantity: over.qty, stopLoss: over.sl ?? null, target: over.tg ?? null, charges: over.charges ?? 15, strategy: over.strategy ?? 'Breakout', emotions: over.emotions ?? 'Calm', notes: over.notes ?? '', status: 'CLOSED' as const, pnl: over.pnl, pnlPercent: over.pnlPercent, screenshots: [], createdAt: d.toISOString() };
  };
  s.trades = [
    mk(1,  {market:'NSE', instrument:'RELIANCE', side:'BUY', entry:2850, exit:2910, qty:50, pnl:2985, pnlPercent:2.09}),
    mk(2,  {market:'NASDAQ', instrument:'AAPL', side:'BUY', entry:182, exit:178, qty:20, pnl:-95, pnlPercent:-2.6}),
    mk(3,  {market:'Crypto', instrument:'BTCUSD', side:'SELL', entry:67200, exit:65800, qty:0.2, pnl:265, pnlPercent:2.08}),
    mk(5,  {market:'NSE', instrument:'TCS', side:'BUY', entry:4020, exit:4150, qty:15, pnl:1935, pnlPercent:3.23}),
    mk(8,  {market:'Forex', instrument:'EURUSD', side:'BUY', entry:1.08, exit:1.085, qty:10000, pnl:35, pnlPercent:0.46}),
    mk(10, {market:'NSE', instrument:'INFY', side:'SELL', entry:1650, exit:1620, qty:30, pnl:885, pnlPercent:1.78}),
  ];
  s.analyses = [
    { id:'a1', title:'RELIANCE breakout setup', notes:'Waiting for volume confirmation above 2900', tags:['breakout','nse'], imageUrl:'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80', uploadedAt: new Date(Date.now()-86400000).toISOString(), createdAt: new Date().toISOString() },
    { id:'a2', title:'BTC 4H bearish divergence', notes:'RSI divergence + rejection at 68k', tags:['crypto','bearish'], imageUrl:'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&q=80', uploadedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
  ];
  fallback.save(s);
}
