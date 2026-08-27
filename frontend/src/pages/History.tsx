import { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { Search, Filter, ArrowUpDown, Download } from 'lucide-react';
import { api } from '../lib/api';

export default function History(){
  const { trades, projects } = useData();
  const [search, setSearch]=useState('');
  const [market, setMarket]=useState('all');
  const [side, setSide]=useState('all');
  const [status, setStatus]=useState('all');
  const [sortBy, setSortBy]=useState<'date'|'pnl'|'instrument'>('date');
  const [sortOrder, setSortOrder]=useState<'asc'|'desc'>('desc');

  const filtered = useMemo(()=>{
    let r = [...trades];
    if(search) {
      const q=search.toLowerCase();
      r=r.filter(t=> t.instrument.toLowerCase().includes(q) || t.market.toLowerCase().includes(q) || (t.strategy||'').toLowerCase().includes(q) || (t.notes||'').toLowerCase().includes(q));
    }
    if(market!=='all') r=r.filter(t=> t.market===market);
    if(side!=='all') r=r.filter(t=> t.side===side);
    if(status!=='all') r=r.filter(t=> t.status===status);
    r.sort((a,b)=>{
      let va:any, vb:any;
      if(sortBy==='date'){ va=new Date(a.date).getTime(); vb=new Date(b.date).getTime(); }
      else if(sortBy==='pnl'){ va=a.pnl?? -999999; vb=b.pnl?? -999999; }
      else { va=a.instrument; vb=b.instrument; }
      if(sortOrder==='asc') return va>vb?1:-1;
      return va<vb?1:-1;
    });
    return r;
  }, [trades, search, market, side, status, sortBy, sortOrder]);

  const exportCSV = async ()=>{
    const hasToken = !!localStorage.getItem('dj_token');
    if(!hasToken){
      const headers = 'Date,Market,Instrument,Side,Entry,Exit,Qty,PNL,Status\n';
      const rows = filtered.map(t=> `${new Date(t.date).toISOString().split('T')[0]},${t.market},${t.instrument},${t.side},${t.entryPrice},${t.exitPrice??''},${t.quantity},${t.pnl??''},${t.status}`).join('\n');
      const blob = new Blob([headers+rows], {type:'text/csv'}); const url=URL.createObjectURL(blob);
      const a=document.createElement('a'); a.href=url; a.download='d-journal.csv'; a.click();
      return;
    }
    try{
      const res = await api.get('/trades/export/csv', { responseType:'blob' });
      const url = URL.createObjectURL(res.data); const a=document.createElement('a'); a.href=url; a.download='d-journal.csv'; a.click();
    } catch{ alert('Export failed'); }
  };

  return (
    <div className="space-y-4 animate-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Trade History</h1><p className="text-sm text-slate-500">Search, filter & sort your trades</p></div>
        <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium"><Download size={16}/> Export CSV</button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search instrument, market, strategy, notes…" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={market} onChange={e=>setMarket(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm">
              <option value="all">All Markets</option><option>NSE</option><option>NASDAQ</option><option>Crypto</option><option>Forex</option><option>MCX</option>
            </select>
            <select value={side} onChange={e=>setSide(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm">
              <option value="all">BUY/SELL</option><option value="BUY">BUY</option><option value="SELL">SELL</option>
            </select>
            <select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm">
              <option value="all">All Status</option><option value="OPEN">OPEN</option><option value="CLOSED">CLOSED</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 text-sm">
          <button onClick={()=>{ setSortBy('date'); setSortOrder(o=> o==='asc'?'desc':'asc');}} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border ${sortBy==='date'?'bg-indigo-600 text-white border-indigo-600':'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}><ArrowUpDown size={14}/> Date {sortBy==='date'?(sortOrder==='asc'?'↑':'↓'):''}</button>
          <button onClick={()=>{ setSortBy('pnl'); setSortOrder(o=> o==='asc'?'desc':'asc');}} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border ${sortBy==='pnl'?'bg-indigo-600 text-white border-indigo-600':'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}><Filter size={14}/> P/L {sortBy==='pnl'?(sortOrder==='asc'?'↑':'↓'):''}</button>
          <span className="ml-auto text-xs text-slate-500 self-center">{filtered.length} / {trades.length} trades</span>
        </div>
      </div>

      {/* desktop table */}
      <div className="hidden lg:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-auto max-h-[65vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-xs text-slate-500"><tr><th className="text-left p-3">Date</th><th className="text-left">Instrument</th><th>Market</th><th>Side</th><th className="text-right">Entry</th><th className="text-right">Exit</th><th className="text-right">Qty</th><th className="text-right">P/L</th><th className="text-center">Status</th></tr></thead>
            <tbody>
              {filtered.map(t=>(
                <tr key={t.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 whitespace-nowrap">{formatDate(t.date)}</td>
                  <td className="font-semibold">{t.instrument} <span className="text-xs text-slate-500 font-normal hidden xl:inline">• {t.strategy||'—'}</span></td>
                  <td className="text-center"><span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs">{t.market}</span></td>
                  <td className="text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold ${t.side==='BUY'?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}`}>{t.side}</span></td>
                  <td className="text-right mono">{t.entryPrice}</td>
                  <td className="text-right mono">{t.exitPrice ?? '—'}</td>
                  <td className="text-right mono">{t.quantity}</td>
                  <td className={`text-right mono font-bold ${t.pnl==null?'text-slate-400': t.pnl>=0?'text-emerald-600':'text-red-600'}`}>{t.pnl==null?'—': formatCurrency(t.pnl)}</td>
                  <td className="text-center"><span className={`text-xs px-2 py-1 rounded-full font-bold ${t.status==='CLOSED'?'bg-slate-900 text-white dark:bg-white dark:text-slate-900':'bg-amber-100 text-amber-700'}`}>{t.status}</span></td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={9} className="p-8 text-center text-slate-500">No trades match filters</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* mobile cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map(t=>(
          <div key={t.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between"><span className="font-bold">{t.instrument} • {t.market}</span><span className={`px-2 py-1 rounded-full text-xs font-bold ${t.side==='BUY'?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}`}>{t.side}</span></div>
            <div className="text-xs text-slate-500">{formatDate(t.date)} • {t.strategy || 'No strategy'} • {t.status}</div>
            <div className="mt-2 flex justify-between text-sm"><span className="mono">{t.entryPrice} → {t.exitPrice ?? '—'} x{t.quantity}</span><span className={`mono font-bold ${t.pnl==null?'text-slate-400': t.pnl>=0?'text-emerald-600':'text-red-600'}`}>{t.pnl==null?'OPEN': formatCurrency(t.pnl)}</span></div>
          </div>
        ))}
        {filtered.length===0 && <div className="rounded-2xl border border-dashed p-6 text-center text-slate-500">No matches</div>}
      </div>
    </div>
  );
}
