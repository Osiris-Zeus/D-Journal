import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { api } from '../lib/api';
import { formatDateTime } from '../lib/utils';
import { Plus, Tag, Trash2, Upload, X, Search } from 'lucide-react';

export default function Analysis(){
  const { analyses, projects, refresh, selectedProject } = useData();
  const [show, setShow]=useState(false);
  const [search, setSearch]=useState('');
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [form, setForm]=useState({ projectId: selectedProject!=='all'? selectedProject:'', title:'', notes:'', tags:'', imageUrl:'' });
  const [uploading, setUploading]=useState(false);
  const [saving, setSaving]=useState(false);

  const filtered = analyses.filter(a=>{
    if(search){
      const q=search.toLowerCase();
      if(!a.title.toLowerCase().includes(q) && !(a.notes||'').toLowerCase().includes(q) && !a.tags.join(' ').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleFile = async (files: FileList | null)=>{
    if(!files||!files[0]) return;
    setUploading(true);
    try{
      const fd=new FormData(); fd.append('image', files[0]);
      try{
        const {data}=await api.post('/upload', fd, {headers:{'Content-Type':'multipart/form-data'}});
        setForm(f=>({...f, imageUrl: data.url}));
      }catch{
        const r=await new Promise<string>((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result as string); fr.onerror=rej; fr.readAsDataURL(files[0]);});
        setForm(f=>({...f, imageUrl: r}));
      }
    } finally{ setUploading(false); }
  };

  const save = async (e:React.FormEvent)=>{
    e.preventDefault();
    if(!form.title || !form.imageUrl) return alert('Title and image required');
    setSaving(true);
    const payload = { projectId: form.projectId || null, title: form.title, notes: form.notes || null, tags: form.tags.split(',').map(s=>s.trim()).filter(Boolean), imageUrl: form.imageUrl };
    try{
      await api.post('/analysis', payload);
      if(!localStorage.getItem('dj_token')){
        const {fallback}=await import('../lib/storage'); const s=fallback.load(); s.analyses.unshift({ id:'a'+Date.now(), ...payload, uploadedAt: new Date().toISOString(), createdAt: new Date().toISOString()}); fallback.save(s);
      }
      setShow(false); setForm({ projectId: selectedProject!=='all'? selectedProject:'', title:'', notes:'', tags:'', imageUrl:''}); await refresh();
    } catch(err:any){ alert(err?.response?.data?.error||err.message); } finally{ setSaving(false); }
  };

  const del = async (id:string)=>{
    if(!confirm('Delete analysis?')) return;
    try{
      await api.delete(`/analysis/${id}`);
      if(!localStorage.getItem('dj_token')){
        const {fallback}=await import('../lib/storage'); const s=fallback.load(); s.analyses=s.analyses.filter((x:any)=> x.id!==id); fallback.save(s);
      }
      await refresh();
    } catch{ alert('Delete failed');}
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Analysis Vault</h1><p className="text-sm text-slate-500">Upload trade-analysis screenshots with exact timestamp</p></div>
        <button onClick={()=>setShow(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 font-medium"><Plus size={18}/> Upload Analysis</button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title, notes, tags…" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2.5 text-sm" />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(a=>(
          <div key={a.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
            <div className="relative group">
              <img
                src={a.imageUrl}
                alt={a.title}
                onClick={() => {
                  console.log("IMAGE CLICKED");
                  setViewImage(a.imageUrl);
                }}
                className="w-full aspect-[16/10] object-cover bg-slate-100 cursor-pointer hover:opacity-90 transition"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition pointer-events-none" />
              <button onClick={()=>del(a.id)} className="absolute top-2 right-2 p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 text-red-600 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
            </div>
            <div className="p-4 flex-1">
              <h3 className="font-bold leading-tight">{a.title}</h3>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {a.tags.map(t=> <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-medium"><Tag size={10}/>{t}</span>)}
                {a.tags.length===0 && <span className="text-xs text-slate-400">No tags</span>}
              </div>
              {a.notes && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{a.notes}</p>}
              <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2">
                <div className="text-[11px] tracking-widest font-semibold text-slate-500">UPLOADED AT</div>
                <div className="text-xs font-medium mono">{formatDateTime(a.uploadedAt)}</div>
                {a.project?.name && <div className="text-xs text-slate-500">Project: {a.project.name}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length===0 && <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-slate-500">No analyses yet. Upload your first screenshot.</div>}

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setShow(false)}/>
          <form onSubmit={save} className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[560px] p-6 space-y-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between"><h3 className="font-bold text-lg">Upload Analysis</h3><button type="button" onClick={()=>setShow(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18}/></button></div>

            <label className="block space-y-1"><span className="text-xs font-semibold text-slate-500">PROJECT (optional)</span>
              <select value={form.projectId} onChange={e=>setForm({...form, projectId:e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm">
                <option value="">No project</option>{projects.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>

            <label className="block space-y-1"><span className="text-xs font-semibold text-slate-500">TITLE *</span><input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Nifty gap-up analysis" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm" required /></label>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">SCREENSHOT *</span>
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 py-8 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                {form.imageUrl? <img src={form.imageUrl} alt="" className="max-h-[180px] rounded-xl" /> : <><Upload size={20}/><span className="text-sm font-medium">{uploading?'Uploading...':'Click to upload screenshot'}</span><span className="text-xs text-slate-500">PNG/JPG up to 8MB</span></>}
                <input type="file" accept="image/*" className="hidden" onChange={e=>handleFile(e.target.files)} />
              </label>
              <div className="text-xs text-slate-500">Exact upload date/time will be auto-saved and displayed</div>
            </div>

            <label className="block space-y-1"><span className="text-xs font-semibold text-slate-500">TAGS (comma separated)</span><input value={form.tags} onChange={e=>setForm({...form, tags:e.target.value})} placeholder="breakout, nifty, bullish" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm" /></label>
            <label className="block space-y-1"><span className="text-xs font-semibold text-slate-500">NOTES</span><textarea value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} rows={3} placeholder="What do you see? Entry plan, invalidation…" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm" /></label>

            <div className="flex gap-3 pt-2"><button type="button" onClick={()=>setShow(false)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 font-medium">Cancel</button><button type="submit" disabled={saving||uploading} className="flex-1 rounded-xl bg-indigo-600 text-white py-2.5 font-semibold disabled:opacity-60">{saving?'Saving...':'Save Analysis'}</button></div>
          </form>
        </div>
      )}
        {viewImage && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setViewImage(null)}
          >
            <button
              onClick={() => setViewImage(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/90 text-slate-900 hover:bg-white"
            >
              <X size={22} />
            </button>

            <img
              src={viewImage}
              alt="Analysis"
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        )}
    </div>
  );
}
