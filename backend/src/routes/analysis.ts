import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const analysisSchema = z.object({
  projectId: z.string().cuid().nullable().optional(),
  title: z.string().min(1).max(100),
  notes: z.string().max(5000).nullable().optional(),
  tags: z.array(z.string().max(30)).default([]),
  imageUrl: z.string().min(1),
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { projectId, tag, search } = req.query as any;
    const where: any = { userId: req.user!.id };
    if (projectId) where.projectId = projectId;
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }
    const items = await prisma.analysis.findMany({ where, orderBy: { uploadedAt: 'desc' }, include: { project: { select: { name: true } } } });
    res.json(items);
  } catch (e) { next(e); }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = analysisSchema.parse(req.body);
    if (data.projectId) {
      const proj = await prisma.project.findFirst({ where: { id: data.projectId, userId: req.user!.id } });
      if (!proj) return res.status(404).json({ error: 'Project not found' });
    }
    const item = await prisma.analysis.create({
      data: {
        userId: req.user!.id,
        projectId: data.projectId || null,
        title: data.title,
        notes: data.notes || null,
        tags: data.tags || [],
        imageUrl: data.imageUrl,
        uploadedAt: new Date(),
      },
    });
    res.status(201).json(item);
  } catch (e) { next(e); }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const item = await prisma.analysis.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (e) { next(e); }
});

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.analysis.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const data = analysisSchema.partial().parse(req.body);
    const updated = await prisma.analysis.update({ where: { id: existing.id }, data });
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.analysis.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prisma.analysis.delete({ where: { id: existing.id } });
    res.json({ message: 'Deleted' });
  } catch (e) { next(e); }
});

export default router;
