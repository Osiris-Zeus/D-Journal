import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { LayoutDashboard, BookOpen, History, BarChart3, Images, FolderKanban, Settings, LogOut, Moon, Sun, Menu, X, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/history', label: 'History', icon: History },
  { to: '/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/analysis', label: 'Analysis', icon: Images },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const { projects, selectedProject, setSelectedProject } = useData();
  const [open, setOpen] = useState(false);
  const navgt = useNavigate();

  const handleLogout = async () => { await logout(); navgt('/auth'); };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-[#0b1220] text-slate-900 dark:text-slate-100">
      {/* desktop sidebar */}
      <aside className="hidden lg:flex w-[280px] shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] sticky top-0 h-screen">
        <div className="h-[64px] flex items-center gap-3 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-[18px]">D</div>
          <div>
            <div className="font-bold leading-none">D-Journal</div>
            <div className="text-[11px] tracking-widest text-slate-500">TRADING JOURNAL</div>
          </div>
        </div>

        <div className="p-4">
          <label className="text-[11px] font-semibold tracking-widest text-slate-500">PROJECT</label>
          <select value={selectedProject} onChange={e=>setSelectedProject(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">All Projects</option>
            {projects.map(p=> <option key={p.id} value={p.id}>{p.name} • {p.currency} {p.startingBalance.toLocaleString()}</option>)}
          </select>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-auto">
          {nav.map(n=>(
            <NavLink key={n.to} to={n.to} className={({isActive})=> `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive? 'bg-indigo-600 text-white shadow-soft':'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <n.icon size={18}/> {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-semibold">{(user?.name||user?.email||'U')[0].toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user?.name || user?.email?.split('@')[0]}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={toggle} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
              {theme==='dark'? <Sun size={16}/>:<Moon size={16}/>} {theme==='dark'?'Light':'Dark'}
            </button>
            <button onClick={handleLogout} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2 text-sm font-medium">
              <LogOut size={16}/> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* mobile */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-[56px] bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button onClick={()=>setOpen(!open)} className="p-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">{open? <X size={18}/>:<Menu size={18}/>}</button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold">D</div>
            <span className="font-bold">D-Journal</span>
          </div>
        </div>
        <button onClick={toggle} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700">{theme==='dark'? <Sun size={18}/>:<Moon size={18}/>}</button>
      </div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/30" onClick={()=>setOpen(false)}>
          <div className="w-[86%] max-w-[320px] h-full bg-white dark:bg-slate-900 flex flex-col" onClick={e=>e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-semibold">{(user?.name||'U')[0]}</div>
              <div><div className="font-semibold text-sm">{user?.name||user?.email}</div><div className="text-xs text-slate-500">{user?.email}</div></div>
            </div>
            <div className="p-3">
              <select value={selectedProject} onChange={e=>setSelectedProject(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
                <option value="all">All Projects</option>
                {projects.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {nav.map(n=>(
                <NavLink key={n.to} to={n.to} onClick={()=>setOpen(false)} className={({isActive})=>`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${isActive?'bg-indigo-600 text-white':'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <n.icon size={18}/> {n.label}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 font-medium"><LogOut size={16}/> Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* main */}
      <div className="flex-1 min-w-0">
        <div className="lg:hidden h-[56px]" />
        <main className="max-w-[1400px] mx-auto p-4 lg:p-8 pb-20 lg:pb-8">
          <Outlet />
        </main>
        {/* bottom nav mobile */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around py-2">
          {nav.slice(0,5).map(n=>(
            <NavLink key={n.to} to={n.to} className={({isActive})=> `flex flex-col items-center gap-1 px-3 py-1 rounded-xl ${isActive?'text-indigo-600':'text-slate-500'}`}>
              <n.icon size={20}/><span className="text-[10px] font-medium">{n.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
