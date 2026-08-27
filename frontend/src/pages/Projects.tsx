import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Plus, Pencil, Trash2, Building2, TrendingUp } from 'lucide-react';

const colors = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];

export default function Projects(){
  const { projects, refresh, stats, setSelectedProject, selectedProject } = useData();
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name:'', description:'', market:'', startingBalance:'100000', currency:'USD', color:'#6366f1' });
  const [saving, setSaving]=useState(false);

  const openNew = ()=>{ setEditing(null); setForm({ name:'', description:'', market:'', startingBalance:'100000', currency:'USD', color: colors[Math.floor(Math.random()*colors.length)]}); setShow(true);};
  const openEdit = (p:any)=>{ setEditing(p); setForm({ name:p.name, description:p.description||'', market:p.market||'', startingBalance:String(p.startingBalance), currency:p.currency, color:p.color}); setShow(true);};

  const save = async (e:React.FormEvent)=>{
    e.preventDefault();
    if(!form.name) return alert('Name required');
    setSaving(true);
    try{
      if(editing){
        await api.put(`/projects/${editing.id}`, { ...form, startingBalance: parseFloat(form.startingBalance)});
        // offline fallback
        if(!localStorage.getItem('dj_token')){
          const {fallback}=await import('../lib/storage'); const s=fallback.load(); s.projects=s.projects.map((x:any)=> x.id===editing.id? {...x,...form, startingBalance:parseFloat(form.startingBalance)}:x); fallback.save(s);
        }
      } else {
        await api.post('/projects', { ...form, startingBalance: parseFloat(form.startingBalance)});
        if(!localStorage.getItem('dj_token')){
          const {fallback}=await import('../lib/storage'); const s=fallback.load(); s.projects.push({ id:'p'+Date.now(), ...form, startingBalance:parseFloat(form.startingBalance), createdAt:new Date().toISOString()}); fallback.save(s);
        }
      }
      setShow(false); await refresh();
    } catch(err:any){ alert(err?.response?.data?.error || err.message); } finally{ setSaving(false); }
  };
  const del = async (id:string)=>{
    if(!confirm('Delete project? All its trades will be removed.')) return;
    try{
      await api.delete(`/projects/${id}`);
      if(!localStorage.getItem('dj_token')){
        const {fallback}=await import('../lib/storage'); const s=fallback.load(); s.projects=s.projects.filter((x:any)=> x.id!==id); s.trades=s.trades.filter((x:any)=> x.projectId!==id); fallback.save(s);
      }
      if(selectedProject===id) setSelectedProject('all');
      await refresh();
    } catch(err:any){ alert(err?.response?.data?.error||'Failed');}
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Projects</h1><p className="text-sm text-slate-500">Each project has its own starting balance & isolated analytics</p></div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 font-medium"><Plus size={18}/> New Project</button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map(p=>{
          const st = stats?.projects.find((x:any)=> x.id===p.id);
          return (
            <div key={p.id} className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 relative overflow-hidden ${selectedProject===p.id?'border-indigo-500 ring-2 ring-indigo-500/20': 'border-slate-200 dark:border-slate-800'}`}>
              <div className="absolute top-0 inset-x-0 h-1" style={{background:p.color}}/>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{background:p.color}}>{p.name[0].toUpperCase()}</div>
                <div className="flex gap-1">
                  <button onClick={()=>openEdit(p)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil size={16}/></button>
                  <button onClick={()=>del(p.id)} className="p-2 rounded-xl hover:bg-red-50 text-red-600"><Trash2 size={16}/></button>
                </div>
              </div>
              <h3 className="font-bold mt-3">{p.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">{p.description || 'No description'}</p>
              <div className="mt-3 flex items-center gap-2 text-xs"><Building2 size={14} className="text-slate-400"/>{p.market || 'All markets'} • {p.currency}</div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><div className="text-[11px] tracking-widest text-slate-500 font-semibold">START</div><div className="font-bold mono">{formatCurrency(p.startingBalance,p.currency)}</div></div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><div className="text-[11px] tracking-widest text-slate-500 font-semibold">CURRENT</div><div className={`font-bold mono ${ (st?.pnl??0) >=0?'text-emerald-600':'text-red-600'}`}>{formatCurrency(st?.currentBalance ?? p.startingBalance,p.currency)}</div></div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${ (st?.pnl??0) >=0?'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10':'bg-red-50 text-red-700 dark:bg-red-500/10'}`}><TrendingUp size={12}/>{st? `${st.pnl>=0?'+':''}${st.pnl.toFixed(2)}` : '—'} P/L</span>
                <button onClick={()=>setSelectedProject(p.id)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${selectedProject===p.id?'bg-indigo-600 text-white border-indigo-600':'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>{selectedProject===p.id?'Selected':'Select'}</button>
              </div>
              <div className="mt-2 text-xs text-slate-500">{(p as any)._count?.trades ?? st?.tradeCount ?? 0} trades • {new Date(p.createdAt).toLocaleDateString()}</div>
            </div>
          );
        })}
      </div>
      {projects.length===0 && <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-500">No projects yet — create your first portfolio to isolate balances.</div>}

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setShow(false)}/>
          <form onSubmit={save} className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[520px] p-6 space-y-4">
            <h3 className="font-bold text-lg">{editing? 'Edit Project':'New Project'}</h3>
            <label className="block space-y-1"><span className="text-xs font-semibold text-slate-500">NAME *</span><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="My Portfolio" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm" required /></label>
            <label className="block space-y-1"><span className="text-xs font-semibold text-slate-500">DESCRIPTION</span><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Long-term NSE swing portfolio" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm"/></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1"><span className="text-xs font-semibold text-slate-500">MARKET</span><input value={form.market} onChange={e=>setForm({...form,market:e.target.value})} placeholder="NSE / Crypto / Forex" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm"/></label>
              <label className="space-y-1"><span className="text-xs font-semibold text-slate-500">CURRENCY</span><select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm"><option>USD</option><option>INR</option><option>EUR</option><option>GBP</option><option>AED</option></select></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1"><span className="text-xs font-semibold text-slate-500">STARTING BALANCE *</span><input type="number" value={form.startingBalance} onChange={e=>setForm({...form,startingBalance:e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm"/></label>
              <label className="space-y-1"><span className="text-xs font-semibold text-slate-500">COLOR</span><div className="flex gap-2 flex-wrap mt-1">{colors.map(c=> <button key={c} type="button" onClick={()=>setForm({...form,color:c})} className={`w-8 h-8 rounded-full border-2 ${form.color===c?'border-slate-900 dark:border-white scale-110':'border-white dark:border-slate-800'}`} style={{background:c}} />)}</div></label>
            </div>
            <div className="flex gap-3 pt-2"><button type="button" onClick={()=>setShow(false)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 font-medium">Cancel</button><button type="submit" disabled={saving} className="flex-1 rounded-xl bg-indigo-600 text-white py-2.5 font-semibold disabled:opacity-60">{saving?'Saving...': editing?'Update':'Create Project'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
