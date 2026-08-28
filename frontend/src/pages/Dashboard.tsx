import { useData } from '../contexts/DataContext';
import { formatCurrency, formatPercent } from '../lib/utils';
import { TrendingUp, TrendingDown, Wallet, Target, Award, ArrowUpRight, Plus, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { stats, trades, projects, selectedProject } = useData();
  const navigate = useNavigate();
  if (!stats) return <div className="p-8 text-center text-slate-500">Loading dashboard…</div>;

  const o = stats.overview;
  const currency = projects.find(p=>p.id===selectedProject)?.currency || 'INR';
  const cards = [
    { label: 'Total P/L', value: formatCurrency(o.totalPnL, currency), sub: `${o.totalTrades} trades`, icon: o.totalPnL>=0? TrendingUp: TrendingDown, color: o.totalPnL>=0?'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10':'text-red-600 bg-red-50 dark:bg-red-500/10' },
    { label: 'Win Rate', value: `${o.winRate.toFixed(1)}%`, sub: `${o.wins}W • ${o.losses}L • ${o.breakeven}BE`, icon: Award, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' },
    { label: 'Balance', value: formatCurrency(o.totalBalance, currency), sub: `Started ${formatCurrency(o.startingBalanceTotal, currency)}`, icon: Wallet, color: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10' },
    { label: 'Profit Factor', value: `${o.profitFactor}`, sub: `Avg W ${formatCurrency(o.avgWin, currency)} • Avg L ${formatCurrency(o.avgLoss, currency)}`, icon: Target, color: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10' },
  ];

  const COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6'];

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-500">Your trading performance at a glance — {selectedProject==='all'?'all projects': projects.find(p=>p.id===selectedProject)?.name}</p>
        </div>
        <button onClick={()=>navigate('/journal')} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 font-medium shadow"><Plus size={18}/> New Trade</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c=>(
          <div key={c.label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-widest text-slate-500">{c.label}</span>
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.color}`}><c.icon size={16}/></span>
            </div>
            <div className="mt-2 text-xl font-bold mono">{c.value}</div>
            <div className="text-xs text-slate-500 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2"><Activity size={16}/> Equity Curve</h3>
            <span className="text-xs text-slate-500">{stats.equityCurve.length} days</span>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.equityCurve}>
                <defs><linearGradient id="eq" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.35}/><stop offset="100%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="date" tick={{fontSize:11}} tickFormatter={v=> v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false} width={70} tickFormatter={v=> currency==='INR'?'₹'+v: '$'+v} />
                <Tooltip contentStyle={{borderRadius:12, border:'none', boxShadow:'0 8px 30px rgba(0,0,0,0.12)'}} />
                <Area type="monotone" dataKey="equity" stroke="#6366f1" strokeWidth={2.5} fill="url(#eq)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h3 className="font-semibold mb-3">P/L by Market</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byMarket}>
                <XAxis dataKey="market" tick={{fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} width={40} tick={{fontSize:11}} />
                <Tooltip />
                <Bar dataKey="pnl" radius={[8,8,0,0]}>
                  {stats.byMarket.map((_:any,i:number)=> <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {stats.byMarket.map((b:any)=>(
              <div key={b.market} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2"><span>{b.market} • {b.count}</span><span className={b.pnl>=0?'text-emerald-600':'text-red-600'}>{b.pnl>=0?'+':''}{b.pnl.toFixed(0)}</span></div>
            ))}
            {stats.byMarket.length===0 && <div className="text-slate-500">No data yet — add trades</div>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Daily P/L</h3>
            <button onClick={()=>navigate('/statistics')} className="text-xs font-medium text-indigo-600 flex items-center gap-1">Details <ArrowUpRight size={14}/></button>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.daily.slice(-14)}>
                <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={v=>v.slice(5)} axisLine={false} tickLine={false}/>
                <YAxis width={50} tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip />
                <Bar dataKey="pnl" radius={[6,6,6,6]}>
                  {stats.daily.slice(-14).map((d:any,i:number)=> <Cell key={i} fill={d.pnl>=0 ? '#10b981':'#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h3 className="font-semibold mb-3">Win / Loss</h3>
          <div className="h-[180px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{name:'Wins',value:o.wins},{name:'Losses',value:o.losses},{name:'BE',value:o.breakeven}]} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={4}>
                  <Cell fill="#10b981"/><Cell fill="#ef4444"/><Cell fill="#94a3b8"/>
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"/> Wins {o.wins}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"/> Losses {o.losses}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"/> BE {o.breakeven}</span>
          </div>
          {o.bestTrade!==0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-3 text-center"><div className="text-xs text-slate-500">Best</div><div className="font-bold text-emerald-600 mono">{formatCurrency(o.bestTrade,currency)}</div></div>
              <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 text-center"><div className="text-xs text-slate-500">Worst</div><div className="font-bold text-red-600 mono">{formatCurrency(o.worstTrade,currency)}</div></div>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent Trades</h3>
            <button onClick={()=>navigate('/history')} className="text-xs font-medium text-indigo-600 flex items-center gap-1">View all <ArrowUpRight size={14}/></button>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500"><tr><th className="text-left py-2">Date</th><th className="text-left">Instrument</th><th className="text-left">Side</th><th className="text-right">P/L</th><th className="text-center">Status</th></tr></thead>
              <tbody>
                {stats.recentTrades.map((t:any)=>(
                  <tr key={t.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2.5 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="font-medium">{t.instrument} <span className="text-xs text-slate-500">{t.market}</span></td>
                    <td><span className={`px-2 py-1 rounded-full text-xs font-bold ${t.side==='BUY'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20':'bg-red-100 text-red-700 dark:bg-red-500/20'}`}>{t.side}</span></td>
                    <td className={`text-right mono font-semibold ${t.pnl==null?'text-slate-400': t.pnl>=0?'text-emerald-600':'text-red-600'}`}>{t.pnl==null?'—': formatCurrency(t.pnl, currency)}</td>
                    <td className="text-center"><span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${t.status==='CLOSED'?'bg-slate-900 text-white dark:bg-white dark:text-slate-900':'bg-amber-100 text-amber-700'}`}>{t.status}</span></td>
                  </tr>
                ))}
                {stats.recentTrades.length===0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">No trades yet. Click New Trade to start journaling.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h3 className="font-semibold mb-3">Projects</h3>
          <div className="space-y-3">
            {stats.projects.map((p:any)=>(
              <div key={p.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{background:p.color}}>{p.name[0]}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.startingBalance.toLocaleString()} → <span className={p.pnl>=0?'text-emerald-600':'text-red-600'}>{p.currentBalance.toLocaleString()}</span></div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.pnl>=0?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-700'}`}>{p.pnl>=0?'+':''}{p.pnl.toFixed(0)}</span>
              </div>
            ))}
            {stats.projects.length===0 && <div className="text-sm text-slate-500">No projects. Create one to isolate balances.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
