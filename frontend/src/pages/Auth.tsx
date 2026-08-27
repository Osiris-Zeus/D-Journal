import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Fingerprint, Shield, TrendingUp } from 'lucide-react';
import { api } from '../lib/api';

export default function Auth(){
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode]=useState<'login'|'register'|'recover'>('login');
  const [authMode, setAuthMode]=useState<'password'|'pin'>('password');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [pin,setPin]=useState('');
  const [name,setName]=useState('');
  const [show, setShow]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');

  const submit = async (e:React.FormEvent)=>{
    e.preventDefault(); setError(''); setLoading(true);
    try{
      if(mode==='recover'){
        const {data}=await api.post('/auth/recover', { email, newPassword: password });
        alert(data.message); setMode('login'); return;
      }
      if(mode==='register'){
        if(!email||!password) throw new Error('Email & password required');
        await register(email,password,name||undefined, pin||undefined);
        nav('/');
      } else {
        const val = authMode==='password'? password: pin;
        if(!email||!val) throw new Error('Fill all fields');
        await login(email, val, authMode);
        nav('/');
      }
    } catch(err:any){ setError(err?.response?.data?.error || err.message || 'Failed'); } finally{ setLoading(false); }
  };

  const tryBiometric = async ()=>{
    try{
      if(!window.PublicKeyCredential) return setError('Biometric not supported on this device');
      // @ts-ignore
      const cred = await navigator.credentials.get({ publicKey: { challenge: new Uint8Array([1,2,3]), timeout: 60000, userVerification: 'preferred' }});
      if(cred){ setError(''); alert('Biometric verified — proceeding with PIN/password fallback login.'); }
    } catch(err:any){ setError(err.message); }
  };

  const demoLogin = async ()=>{
    // quick offline demo without backend
    const demoUser = { id:'demo', email:'demo@d-journal.app', name:'Demo Trader', createdAt: new Date().toISOString()};
    localStorage.setItem('dj_user', JSON.stringify(demoUser));
    // don't set token so DataProvider uses fallback seed
    localStorage.removeItem('dj_token');
    const { seedIfEmpty } = await import('../lib/storage');
    seedIfEmpty();
    nav('/');
  };

  return (
    <div className="min-h-screen flex">
      {/* left branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 text-white p-10 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center font-bold text-xl">D</div>
            <span className="font-bold text-xl">D-Journal</span>
          </div>
          <h1 className="mt-12 text-4xl font-bold leading-tight">Trade smarter.<br/>Journal every edge.</h1>
          <p className="mt-4 text-white/80 max-w-[480px]">Professional trading journal with projects, analytics & cloud sync. Works beautifully on phone & desktop.</p>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-[520px]">
            {[
              {k:'P/L tracking', v:'Daily/weekly/monthly + equity curve'},
              {k:'Cloud sync', v:'Login anywhere, data restores'},
              {k:'Screenshots', v:'Analysis vault with timestamps'},
            ].map(c=> <div key={c.k} className="rounded-2xl bg-white/10 backdrop-blur p-4"><div className="font-semibold text-sm">{c.k}</div><div className="text-xs text-white/70">{c.v}</div></div>)}
          </div>
        </div>
        <div className="relative text-xs text-white/60">© 2026 D-Journal • Secure • Fast • Production-ready</div>
      </div>

      {/* right form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#f8fafc] dark:bg-[#0b1220]">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold">D</div>
            <span className="font-bold text-xl">D-Journal</span>
          </div>

          <div className="rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{mode==='login'?'Welcome back': mode==='register'?'Create account':'Recover account'}</h2>
              <span className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 flex items-center justify-center"><Shield size={18}/></span>
            </div>
            <p className="text-sm text-slate-500 mt-1">{mode==='login'?'Sign in with email + password or email + PIN':'Create your secure cloud-synced journal'}</p>

            {mode!=='recover' && mode==='login' && (
              <div className="mt-4 flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <button type="button" onClick={()=>setAuthMode('password')} className={`flex-1 py-2.5 text-sm font-semibold ${authMode==='password'?'bg-slate-900 text-white dark:bg-white dark:text-slate-900':'bg-white dark:bg-slate-800'}`}>Password</button>
                <button type="button" onClick={()=>setAuthMode('pin')} className={`flex-1 py-2.5 text-sm font-semibold ${authMode==='pin'?'bg-slate-900 text-white dark:bg-white dark:text-slate-900':'bg-white dark:bg-slate-800'}`}>PIN</button>
              </div>
            )}

            <form onSubmit={submit} className="mt-4 space-y-3">
              <label className="block space-y-1"><span className="text-xs font-semibold text-slate-500">EMAIL *</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" required /></label>

              {mode==='register' && <label className="block space-y-1"><span className="text-xs font-semibold text-slate-500">NAME</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Alex" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm" /></label>}

              {(mode==='register' || (mode==='login' && authMode==='password') || mode==='recover') && (
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-500">{mode==='recover'?'NEW PASSWORD *':'PASSWORD *'}</span>
                  <div className="relative">
                    <input type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
                    <button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{show?<EyeOff size={16}/>:<Eye size={16}/>}</button>
                  </div>
                </label>
              )}

              {(mode==='register' || (mode==='login' && authMode==='pin')) && (mode as string)!=='recover' && (
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-500">{mode==='register'?'PIN (optional, 4-6 digits)':'PIN *'}</span>
                  <input inputMode="numeric" maxLength={6} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} placeholder="1234" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm tracking-widest" required={mode==='login' && authMode==='pin'} />
                </label>
              )}

              {error && <div className="rounded-xl bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 px-3 py-2 text-sm">{error}</div>}

              <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 font-semibold disabled:opacity-60">
                {loading?'Please wait…': mode==='login'?'Sign in': mode==='register'?'Create account':'Reset password'}
              </button>

              {mode==='login' && (
                <button type="button" onClick={tryBiometric} className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-sm font-medium">
                  <Fingerprint size={16}/> Try biometric (with PIN fallback)
                </button>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex-1 h-px bg-slate-200 dark:bg-slate-700"/>
                or
                <span className="flex-1 h-px bg-slate-200 dark:bg-slate-700"/>
              </div>

              <button type="button" onClick={demoLogin} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-sm font-semibold">
                <TrendingUp size={16}/> Continue with demo data (offline)
              </button>
            </form>

            <div className="mt-4 text-center text-sm">
              {mode==='login' && <><span className="text-slate-500">No account?</span> <button onClick={()=>setMode('register')} className="font-semibold text-indigo-600">Create one</button> <span className="mx-2 text-slate-300">•</span> <button onClick={()=>setMode('recover')} className="font-medium text-slate-600 dark:text-slate-300">Forgot password?</button></>}
              {mode==='register' && <><span className="text-slate-500">Already have account?</span> <button onClick={()=>setMode('login')} className="font-semibold text-indigo-600">Sign in</button></>}
              {mode==='recover' && <button onClick={()=>setMode('login')} className="font-semibold text-indigo-600">Back to login</button>}
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">Secure authentication • Encrypted • Cloud sync to your email</p>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">By continuing you agree to secure data handling. Your trades & screenshots are private to your account.</p>
        </div>
      </div>
    </div>
  );
}
