import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, Project, Trade, Analysis } from '../lib/api';
import { fallback, seedIfEmpty } from '../lib/storage';

type Stats = any;

type Ctx = {
  projects: Project[];
  trades: Trade[];
  analyses: Analysis[];
  stats: Stats|null;
  selectedProject: string; // 'all' or id
  setSelectedProject: (id: string)=>void;
  loading: boolean;
  refresh: ()=>Promise<void>;
  // optimistic helpers
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>;
  setAnalyses: React.Dispatch<React.SetStateAction<Analysis[]>>;
};

const DataCtx = createContext<Ctx>(null as any);
export const useData = () => useContext(DataCtx);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [stats, setStats] = useState<Stats|null>(null);
  const [selectedProject, setSelectedProject] = useState<string>(()=> localStorage.getItem('dj_project') || 'all');
  const [loading, setLoading] = useState(true);

  useEffect(()=> localStorage.setItem('dj_project', selectedProject), [selectedProject]);

  const refresh = useCallback(async ()=>{
    setLoading(true);
    seedIfEmpty();
    const hasToken = !!localStorage.getItem('dj_token');
    const q = selectedProject !== 'all' ? `?projectId=${selectedProject}` : '';
    const local = fallback.load();

    if (!hasToken) {
      // offline/demo mode: use local fallback
      let p = local.projects as Project[];
      let t = local.trades as Trade[];
      let a = local.analyses as Analysis[];
      if (selectedProject !== 'all') {
        t = t.filter(x => x.projectId === selectedProject);
        a = a.filter(x => !x.projectId || x.projectId === selectedProject);
      }
      // compute simple stats locally
      const closed = t.filter(x=>x.status==='CLOSED');
      const wins = closed.filter(x=> (x.pnl ?? 0) >0).length;
      const totalPnL = closed.reduce((s,x)=> s+(x.pnl??0),0);
      const winRate = closed.length? (wins/closed.length*100):0;
      const bal = p.reduce((s,proj)=>{
        const pt = closed.filter(x=> x.projectId===proj.id);
        return s + proj.startingBalance + pt.reduce((a,b)=> a+(b.pnl??0),0);
      },0);
      const byDate = new Map<string, number>();
      closed.forEach(tr=>{ const k = new Date(tr.date).toISOString().split('T')[0]; byDate.set(k, (byDate.get(k)||0)+(tr.pnl??0)); });
      const daily = Array.from(byDate.entries()).map(([date,pnl])=>({date,pnl})).sort((a,b)=>a.date.localeCompare(b.date));
      let eq = p.reduce((s,pr)=> s+pr.startingBalance,0);
      const equityCurve = daily.map(d=> { eq+=d.pnl; return {date:d.date, equity: Math.round(eq*100)/100};});
      setProjects(p); setTrades(t); setAnalyses(a);
      setStats({
        overview: { totalTrades: closed.length, wins, losses: closed.filter(x=> (x.pnl??0)<0).length, breakeven: closed.filter(x=> (x.pnl??0)===0).length, winRate: Math.round(winRate*10)/10, totalPnL, totalBalance: bal, startingBalanceTotal: p.reduce((s,pr)=>s+pr.startingBalance,0), avgWin:0, avgLoss:0, profitFactor:0, bestTrade:0, worstTrade:0 },
        projects: p.map(pr=> { const pt=closed.filter(x=>x.projectId===pr.id); const pnl=pt.reduce((s,x)=>s+(x.pnl??0),0); return {id:pr.id,name:pr.name, startingBalance:pr.startingBalance, currentBalance: pr.startingBalance+pnl, pnl, color:pr.color};}),
        daily, weekly: daily, monthly: daily, equityCurve,
        byMarket: [], byStrategy: [], recentTrades: t.slice(0,5),
      });
      setLoading(false);
      return;
    }

    try {
      const [projRes, tradeRes, analysisRes, statsRes] = await Promise.all([
        api.get('/projects'),
        api.get(`/trades${q}${q?'&':'?'}limit=200`),
        api.get(`/analysis${q}`),
        api.get(`/stats${q}`),
      ]);
      setProjects(projRes.data);
      setTrades(tradeRes.data.trades ?? tradeRes.data);
      setAnalyses(analysisRes.data);
      setStats(statsRes.data);
      // sync local fallback for offline
      fallback.save({ projects: projRes.data, trades: tradeRes.data.trades ?? tradeRes.data, analyses: analysisRes.data });
    } catch (e:any) {
      console.warn('API refresh failed, falling back to local', e?.message);
      let p = local.projects as Project[];
      let t = local.trades as Trade[];
      let a = local.analyses as Analysis[];
      if (selectedProject !== 'all') {
        t = t.filter(x => x.projectId === selectedProject);
        a = a.filter(x => !x.projectId || x.projectId === selectedProject);
      }
      setProjects(p); setTrades(t); setAnalyses(a);
    } finally { setLoading(false); }
  }, [selectedProject]);

  useEffect(()=> { refresh(); }, [refresh]);

  return <DataCtx.Provider value={{ projects, trades, analyses, stats, selectedProject, setSelectedProject, loading, refresh, setProjects, setTrades, setAnalyses }}>{children}</DataCtx.Provider>;
}
