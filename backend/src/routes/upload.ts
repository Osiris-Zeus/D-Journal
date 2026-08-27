import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `trade-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.post('/', authMiddleware, upload.single('image'), (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // In production, upload to S3/Cloudinary here:
  // if (process.env.CLOUDINARY_URL) => cloudinary.uploader.upload(...)
  // if (process.env.AWS_BUCKET) => s3.send(PutObjectCommand)
  const url = `/uploads/${req.file.filename}`;
  const fullUrl = `${req.protocol}://${req.get('host')}${url}`;
  res.json({ url: fullUrl, path: url, filename: req.file.filename, uploadedAt: new Date().toISOString() });
});

router.post('/multiple', authMiddleware, upload.array('images', 5), (req: AuthRequest, res) => {
  const files = (req as any).files as Express.Multer.File[];
  if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
  const urls = files.map(f => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`);
  res.json({ urls, uploadedAt: new Date().toISOString() });
});

export default router;
