# D-Journal — Professional Trading Journal

Modern, fast, secure & fully responsive trading journal for laptop/desktop and mobile. Built with React + TypeScript + Vite, Node.js + Express, Prisma (PostgreSQL-ready), JWT auth, and Recharts.

## Features
- **Dashboard** — Total P/L, Win Rate, Balance, Recent Trades, Performance Statistics (daily/weekly/monthly)
- **Projects / Portfolios** — Create multiple projects, each with its own starting balance, isolated P/L and stats
- **Trade Journal** — Add / Edit / Delete / View trades: date, market, instrument, buy/sell, entry, exit, qty, stop-loss, target, charges, strategy, emotions, notes, screenshots
- **Trade History** — Search, multi-filter (market, instrument, side, result, date), sorting, pagination
- **Statistics & Charts** — Equity curve, P/L by day/week/month, win/loss distribution, market & strategy breakdown, calendar heatmap (Recharts)
- **Analysis Vault** — Upload trade-analysis screenshots, title, notes, tags; exact upload timestamp auto-saved and displayed
- **Cloud Sync** — All data linked to user account; sign in on any device to restore trades, screenshots, analysis, notes, settings, statistics
- **Authentication** — Email + Password *or* Email + PIN, optional WebAuthn biometric (Fingerprint/FaceID) where available, secure PIN/password fallback, JWT sessions, logout, recovery
- **Data Control** — Backup/Export (JSON + CSV), secure handling, helmet, bcrypt, JWT
- **UX** — Fully responsive, touch-friendly, dark/light themes, polished animations

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (or use SQLite dev fallback) — or `docker compose up`

### 1) Backend
```bash
cd backend
cp .env.example .env   # set DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev # or `npx prisma db push` for quick start
npm run dev            # http://localhost:4000
```

PostgreSQL via Docker:
```bash
docker compose up -d
# DATABASE_URL=postgresql://djournal:djournal@localhost:5432/djournal
```

SQLite fallback (zero-config dev):
- Set `DATABASE_URL="file:./dev.db"` and change `provider` to `sqlite` in `prisma/schema.prisma` for local dev without Postgres. Production should use `postgresql`.

### 2) Frontend
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

### 3) Production build
```bash
# backend
cd backend && npm run build && npm start
# frontend
cd frontend && npm run build && npm run preview
```

## Deployment
- Backend: Render / Railway / Fly.io / Vercel (Node) — set `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `CLOUDINARY_*` or `AWS_*`
- DB: Supabase / Neon / Railway PostgreSQL (just set DATABASE_URL)
- Frontend: Vercel / Netlify — set `VITE_API_URL`
- Images: Local `uploads/` in dev; swap to S3/Cloudinary by setting env (see `backend/src/routes/upload.ts`)

## Tech Stack
React 18 • TypeScript • Vite • Tailwind CSS • React Router • Recharts • Axios • Zustand-style Context • Express • Prisma • PostgreSQL • JWT • bcrypt • Multer • Helmet • Zod • date-fns • Lucide

## Security
- Passwords & PINs hashed with bcrypt (12 rounds)
- JWT (7d) + refresh rotation, httpOnly ready, helmet, CORS, rate-limit ready
- Biometric via WebAuthn (`@simplewebauthn` ready) with PIN fallback
- Validation with Zod, sanitized uploads, size limits

## License
MIT — Built for traders, by traders.
