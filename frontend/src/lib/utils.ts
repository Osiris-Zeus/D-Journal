export function cn(...a: (string|false|undefined)[]) { return a.filter(Boolean).join(' '); }
export function formatCurrency(n: number, currency='USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);
}
export function formatPercent(n: number) { return `${n >=0?'+':''}${n.toFixed(2)}%`; }
export function formatDate(d: string|Date) {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'});
}
export function formatDateTime(d: string|Date) {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true });
}
export function calcPnL(side:'BUY'|'SELL', entry:number, exit:number|null|undefined, qty:number, charges=0) {
  if (exit==null) return null;
  const raw = side==='BUY' ? (exit-entry)*qty : (entry-exit)*qty;
  return raw - charges;
}
