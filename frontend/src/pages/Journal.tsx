import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Pencil, Trash2, Eye, Image as ImageIcon } from 'lucide-react';
import TradeModal from '../components/TradeModal';

export default function Journal(){
  const { trades, refresh } = useData();
  const [modalOpen, setModalOpen]=useState(false);
  const [editing, setEditing]=useState<any>(null);
  const [view, setView]=useState<any>(null);

  const onEdit = (t:any)=>{ setEditing(t); setModalOpen(true); };
  const onNew = ()=>{ setEditing(null); setModalOpen(true); };
  const onDelete = async (id:string)=>{
    if(!confirm('Delete this trade?')) return;
    try{
      await api.delete(`/trades/${id}`);
      if(!localStorage.getItem('dj_token')){
        const {fallback}=await import('../lib/storage'); const s=fallback.load(); s.trades=s.trades.filter((x:any)=> x.id!==id); fallback.save(s);
      }
      await refresh();
    } catch(e:any){ alert(e?.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Trade Journal</h1><p className="text-sm text-slate-500">Add, edit, view and manage all your trades</p></div>
        <button onClick={onNew} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 font-medium"><Plus size={18}/> New Trade</button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {trades.map(t=>(
          <div key={t.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
            <div className="h-1" style={{background: t.pnl==null? '#f59e0b' : t.pnl>=0 ? '#10b981':'#ef4444'}}/>
            <div className="p-4 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold">{t.instrument} <span className="text-xs font-normal text-slate-500">{t.market}</span></div>
                  <div className="text-xs text-slate-500">{formatDate(t.date)} • {t.project?.name || ''} • {t.strategy || 'No strategy'}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${t.side==='BUY'?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}`}>{t.side}</span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-2"><div className="text-[10px] tracking-widest text-slate-500 font-semibold">ENTRY</div><div className="font-semibold mono text-sm">{t.entryPrice}</div></div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-2"><div className="text-[10px] tracking-widest text-slate-500 font-semibold">EXIT</div><div className="font-semibold mono text-sm">{t.exitPrice ?? '—'}</div></div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-2"><div className="text-[10px] tracking-widest text-slate-500 font-semibold">QTY</div><div className="font-semibold mono text-sm">{t.quantity}</div></div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">P/L</div>
                  <div className={`font-bold mono ${t.pnl==null?'text-slate-400': t.pnl>=0?'text-emerald-600':'text-red-600' }`}>{t.pnl==null?'OPEN': `${t.pnl>=0?'+':''}${formatCurrency(t.pnl)}`} {t.pnlPercent!=null && <span className="text-xs font-normal">({t.pnlPercent>=0?'+':''}{t.pnlPercent.toFixed(2)}%)</span>}</div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${t.status==='CLOSED'?'bg-slate-900 text-white dark:bg-white dark:text-slate-900':'bg-amber-100 text-amber-700'}`}>{t.status}</span>
              </div>

              {(t.stopLoss || t.target) && <div className="mt-2 flex gap-2 text-xs"><span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">SL: {t.stopLoss ?? '—'}</span><span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">TGT: {t.target ?? '—'}</span><span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">Fees: {t.charges}</span></div>}

              {t.notes && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{t.notes}</p>}

              {t.screenshots?.length>0 && (
                <div className="mt-3 flex gap-2 overflow-auto">
                  {t.screenshots.slice(0,3).map((s:string,i:number)=> <img key={i} src={s} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />)}
                  {t.screenshots.length>3 && <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">+{t.screenshots.length-3}</div>}
                </div>
              )}
              <div className="mt-2 flex gap-1 text-xs text-slate-500 items-center"><ImageIcon size={12}/>{t.screenshots?.length||0} screenshots • {t.emotions || '—'} </div>
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button onClick={()=>setView(t)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"><Eye size={16}/> View</button>
              <button onClick={()=>onEdit(t)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2 text-sm font-medium"><Pencil size={16}/> Edit</button>
              <button onClick={()=>onDelete(t.id)} className="px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
      {trades.length===0 && <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center"><div className="text-slate-500 mb-3">No trades yet. Start journaling to see your edge.</div><button onClick={onNew} className="rounded-xl bg-indigo-600 text-white px-6 py-2.5 font-medium">Add First Trade</button></div>}

      <TradeModal open={modalOpen} onClose={()=>setModalOpen(false)} editing={editing} onSaved={refresh} />

      {view && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setView(null)}/>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[680px] max-h-[85vh] overflow-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold">{view.instrument} • {view.market} • {view.side}</h3>
              <button onClick={()=>setView(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><div className="text-xs text-slate-500">Date</div><div className="font-medium">{formatDate(view.date)}</div></div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><div className="text-xs text-slate-500">Project</div><div className="font-medium">{view.project?.name || view.projectId}</div></div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><div className="text-xs text-slate-500">Entry / Exit / Qty</div><div className="font-medium mono">{view.entryPrice} / {view.exitPrice ?? '—'} / {view.quantity}</div></div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><div className="text-xs text-slate-500">P/L</div><div className={`font-bold ${view.pnl>=0?'text-emerald-600':'text-red-600'}`}>{view.pnl==null?'OPEN': formatCurrency(view.pnl)} {view.pnlPercent!=null? `(${view.pnlPercent.toFixed(2)}%)`:''}</div></div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><div className="text-xs text-slate-500">SL / Target / Charges</div><div className="font-medium">{view.stopLoss ?? '—'} / {view.target ?? '—'} / {view.charges}</div></div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><div className="text-xs text-slate-500">Strategy / Emotion</div><div className="font-medium">{view.strategy || '—'} / {view.emotions || '—'}</div></div>
              </div>
              {view.notes && <div><div className="text-xs font-semibold text-slate-500">NOTES</div><div className="mt-1 rounded-xl bg-slate-50 dark:bg-slate-800 p-3 whitespace-pre-wrap">{view.notes}</div></div>}
              {view.screenshots?.length>0 && <div><div className="text-xs font-semibold text-slate-500">SCREENSHOTS</div><div className="mt-2 grid grid-cols-2 gap-2">{view.screenshots.map((s:string,i:number)=> <a key={i} href={s} target="_blank" rel="noreferrer"><img src={s} alt="" className="w-full rounded-xl border border-slate-200 dark:border-slate-700" /></a>)}</div></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
