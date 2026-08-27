import { useData } from '../contexts/DataContext';
import { formatCurrency } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { useState } from 'react';

export default function Statistics(){
  const { stats } = useData();
  const [gran, setGran] = useState<'daily'|'weekly'|'monthly'>('daily');
  if(!stats) return <div className="p-8 text-center text-slate-500">Loading statistics…</div>;
  const data = stats[gran];
  const o = stats.overview;

  return (
    <div className="space-y-6 animate-in">
      <div><h1 className="text-2xl font-bold">Statistics & Charts</h1><p className="text-sm text-slate-500">Daily, weekly & monthly performance</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Trades" value={String(o.totalTrades)} sub={`${o.wins}W / ${o.losses}L`} />
        <Stat label="Win Rate" value={`${o.winRate.toFixed(1)}%`} sub={`PF ${o.profitFactor}`} />
        <Stat label="Total P/L" value={formatCurrency(o.totalPnL)} sub={`${formatCurrency(o.avgWin)} avg win`} accent={o.totalPnL>=0}/>
        <Stat label="Balance" value={formatCurrency(o.totalBalance)} sub={`from ${formatCurrency(o.startingBalanceTotal)}`} accent={o.totalBalance>=o.startingBalanceTotal}/>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Performance ({gran})</h3>
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            {(['daily','weekly','monthly'] as const).map(g=>(
              <button key={g} onClick={()=>setGran(g)} className={`px-3 py-1.5 text-xs font-semibold capitalize ${gran===g?'bg-indigo-600 text-white':'bg-white dark:bg-slate-800'}`}>{g}</button>
            ))}
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="date" tick={{fontSize:11}} tickFormatter={v=> gran==='monthly'? v : v.slice(5)} axisLine={false} tickLine={false}/>
              <YAxis width={60} tick={{fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip />
              <Bar dataKey="pnl" radius={[8,8,0,0]}>
                {data.map((d:any,i:number)=> <Cell key={i} fill={d.pnl>=0?'#10b981':'#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h3 className="font-semibold mb-3">Equity Curve</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.equityCurve}>
                <defs><linearGradient id="eq2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35}/><stop offset="100%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="date" tick={{fontSize:11}} tickFormatter={v=>v.slice(5)} axisLine={false} tickLine={false}/>
                <YAxis width={60} tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip />
                <Area type="monotone" dataKey="equity" stroke="#06b6d4" strokeWidth={2.5} fill="url(#eq2)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h3 className="font-semibold mb-3">By Strategy</h3>
          <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
            {stats.byStrategy.map((s:any)=>(
              <div key={s.strategy} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-3">
                <div><div className="font-medium text-sm">{s.strategy}</div><div className="text-xs text-slate-500">{s.count} trades</div></div>
                <div className={`font-bold mono ${s.pnl>=0?'text-emerald-600':'text-red-600'}`}>{s.pnl>=0?'+':''}{formatCurrency(s.pnl)}</div>
              </div>
            ))}
            {stats.byStrategy.length===0 && <div className="text-sm text-slate-500">Add trades with strategies to see breakdown</div>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <h3 className="font-semibold mb-3">Monthly P/L Heatmap</h3>
        <div className="overflow-auto">
          <div className="min-w-[600px] grid grid-cols-6 gap-2">
            {stats.monthly.map((m:any)=>(
              <div key={m.date} className={`rounded-xl p-3 text-center border ${m.pnl>=0?'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400':'bg-red-50 border-red-200 dark:bg-red-500/10 text-red-700 dark:text-red-400'}`}>
                <div className="text-xs font-semibold">{m.date}</div><div className="font-bold mono text-sm">{m.pnl>=0?'+':''}{m.pnl.toFixed(0)}</div>
              </div>
            ))}
            {stats.monthly.length===0 && <div className="col-span-6 text-center text-sm text-slate-500 py-6">Not enough data for monthly view</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
function Stat({label, value, sub, accent}:{label:string; value:string; sub:string; accent?:boolean}){
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="text-xs tracking-widest font-semibold text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-bold mono ${accent===true?'text-emerald-600': accent===false?'text-red-600':''}`}>{value}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>
  );
}
