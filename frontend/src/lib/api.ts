import axios from 'axios';

const API = (import.meta as any).env?.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API ? `${API}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('dj_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dj_token');
      localStorage.removeItem('dj_user');
      if (!location.pathname.includes('/auth')) location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export type Project = {
  id: string; name: string; description?: string; market?: string;
  startingBalance: number; currency: string; color: string;
  totalPnL?: number; currentBalance?: number; tradeCount?: number;
  createdAt: string;
};
export type Trade = {
  id: string; projectId: string; date: string; market: string; instrument: string;
  side: 'BUY'|'SELL'; entryPrice: number; exitPrice: number|null; quantity: number;
  stopLoss: number|null; target: number|null; charges: number; strategy?: string|null;
  emotions?: string|null; notes?: string|null; status:'OPEN'|'CLOSED'; pnl: number|null; pnlPercent:number|null;
  screenshots: string[]; createdAt: string; project?: {name:string,color:string};
};
export type Analysis = {
  id: string; projectId?: string|null; title: string; notes?: string|null; tags: string[];
  imageUrl: string; uploadedAt: string; createdAt: string; project?: {name:string}|null;
};
