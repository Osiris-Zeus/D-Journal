import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

type User = { id: string; email: string; name?: string; avatarUrl?: string; createdAt?: string };
type CtxType = {
  user: User | null;
  token: string | null;
  login: (email: string, passwordOrPin: string, mode: 'password'|'pin') => Promise<void>;
  register: (email: string, password: string, name?: string, pin?: string) => Promise<void>;
  logout: () => void;
  logoutAll: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setUser: (u: User|null) => void;
};

const Ctx = createContext<CtxType>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { const r = localStorage.getItem('dj_user'); return r ? JSON.parse(r) : null; } catch { return null; }
  });
  const [token, setToken] = useState<string|null>(() => localStorage.getItem('dj_token'));

  const persist = (u: User|null, t: string|null) => {
    setUser(u); setToken(t);
    if (u) localStorage.setItem('dj_user', JSON.stringify(u)); else localStorage.removeItem('dj_user');
    if (t) localStorage.setItem('dj_token', t); else localStorage.removeItem('dj_token');
  };

  const login = async (email: string, val: string, mode: 'password'|'pin') => {
    const body = mode === 'password' ? { email, password: val } : { email, pin: val };
    const { data } = await api.post('/auth/login', body);
    persist(data.user, data.token);
  };
  const register = async (email: string, password: string, name?: string, pin?: string) => {
    const { data } = await api.post('/auth/register', { email, password, name, pin });
    persist(data.user, data.token);
  };
  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    persist(null, null);
  };
  const logoutAll = async () => {
    await api.post('/auth/logout-all');
    persist(null, null);
  };
  const refreshMe = async () => {
    if (!token) return;
    try {
      const { data } = await api.get('/auth/me');
      persist(data.user, token);
    } catch { persist(null, null); }
  };

  useEffect(() => { if (token) refreshMe(); }, []);

  // biometric helpers
  const supportsBiometric = !!(navigator as any).credentials;

  return <Ctx.Provider value={{ user, token, login, register, logout, logoutAll, refreshMe, setUser }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
