import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useData } from '../contexts/DataContext';
import { X, Upload, Trash2 } from 'lucide-react';

type Props = { open: boolean; onClose: ()=>void; editing?: any; onSaved: ()=>void; };

const markets = ['NSE','NASDAQ','NYSE','BSE','Crypto','Forex','MCX','CME'];
const emotions = ['Calm','Confident','Fearful','Greedy','Revenge','Patient','Anxious','Disciplined'];
const strategies = ['Breakout','Reversal','Scalping','Swing','SMC','Price Action','VWAP','OR B'];

export default function TradeModal({ open, onClose, editing, onSaved }: Props) {
  const { projects, selectedProject } = useData();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({
    projectId: selectedProject !== 'all' ? selectedProject : projects[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    market: 'NSE',
    instrument: '',
    side: 'BUY',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    stopLoss: '',
    target: '',
    charges: '0',
    strategy: 'Breakout',
    emotions: 'Calm',
    notes: '',
    screenshots: [] as string[],
  });
  const [uploading, setUploading] = useState(false);

  useEffect(()=>{
    if (editing) {
      setForm({
        projectId: editing.projectId,
        date: new Date(editing.date).toISOString().split('T')[0],
        market: editing.market,
        instrument: editing.instrument,
        side: editing.side,
        entryPrice: String(editing.entryPrice),
        exitPrice: editing.exitPrice != null ? String(editing.exitPrice) : '',
        quantity: String(editing.quantity),
        stopLoss: editing.stopLoss != null ? String(editing.stopLoss) : '',
        target: editing.target != null ? String(editing.target) : '',
        charges: String(editing.charges ?? 0),
        strategy: editing.strategy || 'Breakout',
        emotions: editing.emotions || 'Calm',
        notes: editing.notes || '',
        screenshots: editing.screenshots || [],
      });
    } else {
      setForm((f:any)=> ({...f, projectId: selectedProject !== 'all' ? selectedProject : projects[0]?.id || f.projectId }));
    }
  }, [editing, open, projects, selectedProject]);

  if (!open) return null;

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length===0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      // try API upload, fallback to base64
      try {
        for (const f of Array.from(files).slice(0,5)) fd.append(f === files[0] ? 'image' : 'images', f);
        let urls: string[] = [];
        if (files.length===1) {
          const { data } = await api.post('/upload', fd, { headers: { 'Content-Type':'multipart/form-data' }});
          urls = [data.url];
        } else {
          const fd2 = new FormData(); Array.from(files).forEach(f=> fd2.append('images', f));
          const { data } = await api.post('/upload/multiple', fd2, { headers: { 'Content-Type':'multipart/form-data' }});
          urls = data.urls;
        }
        setForm((f:any)=> ({...f, screenshots: [...f.screenshots, ...urls]}));
      } catch {
        // fallback: base64 local
        const reads = await Promise.all(Array.from(files).map(f=> new Promise<string>((res,rej)=>{
          const r=new FileReader(); r.onload=()=>res(r.result as string); r.onerror=rej; r.readAsDataURL(f);
        })));
        setForm((f:any)=> ({...f, screenshots: [...f.screenshots, ...reads]}));
      }
    } finally { setUploading(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.instrument || !form.entryPrice || !form.quantity) return alert('Fill instrument, entry & qty');
    setLoading(true);
    const payload = {
      projectId: form.projectId,
      date: new Date(form.date).toISOString(),
      market: form.market,
      instrument: form.instrument.toUpperCase(),
      side: form.side,
      entryPrice: parseFloat(form.entryPrice),
      exitPrice: form.exitPrice ? parseFloat(form.exitPrice) : null,
      quantity: parseFloat(form.quantity),
      stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : null,
      target: form.target ? parseFloat(form.target) : null,
      charges: parseFloat(form.charges || '0'),
      strategy: form.strategy,
      emotions: form.emotions,
      notes: form.notes,
      screenshots: form.screenshots,
    };
    try {
      if (editing) await api.put(`/trades/${editing.id}`, payload);
      else await api.post('/trades', payload);
      // offline fallback: also push to local storage if API failed previously? DataContext will refresh but ensure fallback sync
      // For offline mode without backend, we manually update fallback
      const hasToken = !!localStorage.getItem('dj_token');
      if (!hasToken) {
        const { fallback } = await import('../lib/storage');
        const s = fallback.load();
        if (editing) {
          s.trades = s.trades.map((t:any)=> t.id===editing.id ? {...t, ...payload, pnl: payload.exitPrice? (payload.side==='BUY'?(payload.exitPrice-payload.entryPrice)*payload.quantity:(payload.entryPrice-payload.exitPrice)*payload.quantity)-payload.charges : null } : t);
        } else {
          s.trades.unshift({ id: 't'+Date.now(), ...payload, pnl: payload.exitPrice? (payload.side==='BUY'?(payload.exitPrice-payload.entryPrice)*payload.quantity:(payload.entryPrice-payload.exitPrice)*payload.quantity)-payload.charges : null, pnlPercent:0, status: payload.exitPrice?'CLOSED':'OPEN', createdAt: new Date().toISOString() });
        }
        fallback.save(s);
      }
      onSaved(); onClose();
    } catch (err:any) {
      alert(err?.response?.data?.error || err.message || 'Failed to save');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-[640px] bg-white dark:bg-slate-900 h-full overflow-auto shadow-2xl animate-in flex flex-col">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between z-10">
          <h2 className="font-bold text-lg">{editing ? 'Edit Trade' : 'New Trade'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20}/></button>
        </div>

        <form onSubmit={submit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">PROJECT *</span>
              <select value={form.projectId} onChange={e=>setForm({...form, projectId:e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm">
                {projects.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">DATE *</span>
              <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm" required />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">MARKET</span>
              <select value={form.market} onChange={e=>setForm({...form, market:e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm">
                {markets.map(m=> <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">INSTRUMENT *</span>
              <input value={form.instrument} onChange={e=>setForm({...form, instrument:e.target.value})} placeholder="RELIANCE" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm uppercase" required />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">SIDE</span>
              <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                {(['BUY','SELL'] as const).map(s=>(
                  <button key={s} type="button" onClick={()=>setForm({...form, side:s})} className={`flex-1 py-2.5 text-sm font-bold ${form.side===s? (s==='BUY'?'bg-emerald-600 text-white':'bg-red-600 text-white'):'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{s}</button>
                ))}
              </div>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-500">ENTRY *</span><input type="number" step="0.01" value={form.entryPrice} onChange={e=>setForm({...form, entryPrice:e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm" /></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-500">EXIT</span><input type="number" step="0.01" value={form.exitPrice} onChange={e=>setForm({...form, exitPrice:e.target.value})} placeholder="leave empty if open" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm" /></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-500">QTY *</span><input type="number" step="0.01" value={form.quantity} onChange={e=>setForm({...form, quantity:e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm" /></label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-500">STOP LOSS</span><input type="number" step="0.01" value={form.stopLoss} onChange={e=>setForm({...form, stopLoss:e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm" /></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-500">TARGET</span><input type="number" step="0.01" value={form.target} onChange={e=>setForm({...form, target:e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm" /></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-500">CHARGES</span><input type="number" step="0.01" value={form.charges} onChange={e=>setForm({...form, charges:e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm" /></label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-500">STRATEGY</span><select value={form.strategy} onChange={e=>setForm({...form, strategy:e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm">{strategies.map(s=> <option key={s} value={s}>{s}</option>)}</select></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-500">EMOTION</span><select value={form.emotions} onChange={e=>setForm({...form, emotions:e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm">{emotions.map(s=> <option key={s} value={s}>{s}</option>)}</select></label>
          </div>

          <label className="space-y-1 block"><span className="text-xs font-semibold text-slate-500">NOTES</span><textarea value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} rows={3} placeholder="What was your plan? What did you learn?" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm" /></label>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500">SCREENSHOTS</span>
            <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 py-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <Upload size={18}/> <span className="text-sm font-medium">{uploading? 'Uploading...':'Tap to upload images'}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={e=>handleUpload(e.target.files)} />
            </label>
            {form.screenshots.length>0 && (
              <div className="grid grid-cols-3 gap-2">
                {form.screenshots.map((src:string,i:number)=>(
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-[4/3] bg-slate-100 dark:bg-slate-800">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={()=>setForm({...form, screenshots: form.screenshots.filter((_:any,idx:number)=> idx!==i)})} className="absolute top-1 right-1 p-1.5 rounded-lg bg-red-600 text-white opacity-90"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-3 font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-[1.5] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 font-semibold disabled:opacity-60">{loading? 'Saving...': editing? 'Update Trade':'Save Trade'}</button>
          </div>
          <div className="text-center text-xs text-slate-400">Cloud sync enabled • stored securely to your account</div>
        </form>
      </div>
    </div>
  );
}
