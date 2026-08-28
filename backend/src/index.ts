import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import tradeRoutes from './routes/trades';
import analysisRoutes from './routes/analysis';
import statsRoutes from './routes/stats';
import uploadRoutes from './routes/upload';
import { errorHandler } from './middleware/error';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: [
    FRONTEND_URL,
    'http://localhost',
    'https://localhost',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use(limiter);

// Static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString(), service: 'd-journal-backend' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/upload', uploadRoutes);

// Export all data for backup
app.get('/api/export', async (req: any, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    const { verifyToken } = await import('./lib/auth');
    const prisma = (await import('./lib/prisma')).default;
    const payload = verifyToken(auth.split(' ')[1]);
    const [projects, trades, analyses, user] = await Promise.all([
      prisma.project.findMany({ where: { userId: payload.id } }),
      prisma.trade.findMany({ where: { userId: payload.id }, orderBy: { date: 'desc' } }),
      prisma.analysis.findMany({ where: { userId: payload.id }, orderBy: { uploadedAt: 'desc' } }),
      prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, email: true, name: true, createdAt: true } }),
    ]);
    res.json({ user, projects, trades, analyses, exportedAt: new Date().toISOString() });
  } catch (e) { next(e); }
});

app.use(errorHandler);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`✅ D-Journal backend running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Frontend CORS: ${FRONTEND_URL}`);
});
