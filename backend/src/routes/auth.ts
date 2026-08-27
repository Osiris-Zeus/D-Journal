import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { hashPassword, hashPin, verifyPassword, signToken, sanitizeEmail } from '../lib/auth';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  name: z.string().min(1).max(50).optional(),
  pin: z.string().regex(/^\d{4,6}$/).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().optional(),
  pin: z.string().optional(),
}).refine(d => d.password || d.pin, { message: 'Provide password or PIN' });

const pinSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/),
});

const recoverySchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6),
});

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, pin } = registerSchema.parse(req.body);
    const cleanEmail = sanitizeEmail(email);
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await hashPassword(password);
    const pinHash = pin ? await hashPin(pin) : null;

    const user = await prisma.user.create({
      data: { email: cleanEmail, passwordHash, pinHash, name: name || cleanEmail.split('@')[0] },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    // auto-create default project
    await prisma.project.create({
      data: {
        userId: user.id,
        name: 'My Portfolio',
        description: 'Default trading portfolio',
        startingBalance: 100000,
        currency: 'USD',
        color: '#6366f1',
      },
    });

    const token = signToken({ id: user.id, email: user.email });
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
    });

    res.status(201).json({ user, token });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password, pin } = loginSchema.parse(req.body);
    const cleanEmail = sanitizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    let valid = false;
    if (password && user.passwordHash) valid = await verifyPassword(password, user.passwordHash);
    else if (pin && user.pinHash) valid = await verifyPassword(pin, user.pinHash);
    // allow PIN login even if password exists, and vice versa (fallback)
    if (!valid && password && user.passwordHash === null && pin && user.pinHash) {
      // already checked PIN above
    }
    // If both provided, try both
    if (!valid && password && pin && user.passwordHash && user.pinHash) {
      valid = (await verifyPassword(password, user.passwordHash)) || (await verifyPassword(pin, user.pinHash));
    }

    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ id: user.id, email: user.email });
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
    });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      token,
    });
  } catch (e) { next(e); }
});

router.post('/pin', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { pin } = pinSchema.parse(req.body);
    const pinHash = await hashPin(pin);
    await prisma.user.update({ where: { id: req.user!.id }, data: { pinHash } });
    res.json({ message: 'PIN updated' });
  } catch (e) { next(e); }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e) { next(e); }
});

router.post('/logout', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) await prisma.session.deleteMany({ where: { token } });
    res.json({ message: 'Logged out' });
  } catch (e) { next(e); }
});

router.post('/logout-all', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await prisma.session.deleteMany({ where: { userId: req.user!.id } });
    res.json({ message: 'All sessions revoked' });
  } catch (e) { next(e); }
});

router.get('/sessions', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, expiresAt: true, userAgent: true, ip: true },
    });
    res.json(sessions);
  } catch (e) { next(e); }
});

// Simple recovery (in production, send email with token)
router.post('/recover', async (req, res, next) => {
  try {
    const { email, newPassword } = recoverySchema.parse(req.body);
    const cleanEmail = sanitizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) return res.status(404).json({ error: 'Email not found' });
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await prisma.session.deleteMany({ where: { userId: user.id } });
    res.json({ message: 'Password reset successful. Please login.' });
  } catch (e) { next(e); }
});

// WebAuthn placeholder - store credential id
router.post('/webauthn/register', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing credential' });
    await prisma.user.update({ where: { id: req.user!.id }, data: { webauthnCredential: JSON.stringify(credential) } });
    res.json({ message: 'Biometric credential saved' });
  } catch (e) { next(e); }
});

export default router;
