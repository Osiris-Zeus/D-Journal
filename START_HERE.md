# D-Journal — Start Here (30 seconds)

## Option A — Demo without database (instant, offline)
1. Double-click `run.bat` (Windows) or run `npm run dev` in both `backend/` and `frontend/`
2. Open http://localhost:5173
3. Click **"Continue with demo data (offline)"** — full app works with local storage, no DB needed
4. Add trades, projects, screenshots — all saved locally & backed by cloud when you later sign in

## Option B — Full cloud sync (recommended)
1. Install PostgreSQL or run `docker compose up -d` (starts Postgres at localhost:5432)
2. Backend: `cd backend && cp .env.example .env && npx prisma migrate dev && npm run dev` → http://localhost:4000
3. Frontend: `cd frontend && npm install && npm run dev` → http://localhost:5173
4. Register with email + password (or PIN) → your data is now cloud-synced. Sign in on any device to restore.

## Default demo credentials
- Email: `demo@d-journal.app` → use **Continue with demo data** button (no password needed)
- Or register any email, e.g. `you@example.com` / `password123` + optional 4-digit PIN `1234`

## What to try
- **Dashboard**: equity curve, win rate, balance per project
- **Projects**: create a new project with its own startingBalance (e.g. Crypto Lab $25k)
- **Journal → New Trade**: fill instrument, buy/sell, entry/exit, SL/TP, screenshots
- **History**: search "RELIANCE", filter by NSE / BUY, sort by P/L
- **Statistics**: toggle daily/weekly/monthly, see by-strategy
- **Analysis**: upload a chart screenshot — note the exact timestamp auto-saved
- **Settings**: toggle dark/light, set PIN, enable biometric, export JSON/CSV, view sessions

## Deploy
- Frontend: Vercel/Netlify → set `VITE_API_URL` to backend URL
- Backend: Render/Railway/Fly → set `DATABASE_URL` (Supabase/Neon), `JWT_SECRET`, `FRONTEND_URL`
- DB: switch `prisma/schema.prisma` provider to `postgresql` (already) and set `DATABASE_URL`
- Images: set Cloudinary/AWS env and update `backend/src/routes/upload.ts` (local `uploads/` works for dev)

## Troubleshooting
- `npm run build` passes for both backend & frontend (verified)
- If backend 4000 busy, set `PORT=4001` in `backend/.env`
- Prisma: `npx prisma generate` after changing provider; `npx prisma db push` for quick sync
- Images 404? Ensure `backend/uploads/` exists and frontend proxy is on (`vite.config.ts`)

Enjoy — D-Journal is production-ready!
