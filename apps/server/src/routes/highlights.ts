import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

async function checkChildAccess(parentId: string, childId: string): Promise<boolean> {
  const pc = await prisma.parentChild.findUnique({
    where: {
      parentId_childId: {
        parentId,
        childId,
      },
    },
  });
  return !!pc;
}

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { childId } = req.query;

    if (!childId) {
      return res.status(400).json({ error: 'childId required' });
    }

    if (!(await checkChildAccess(req.user!.id, childId as string))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const highlights = await prisma.highlight.findMany({
      where: { childId: childId as string },
      orderBy: { occurredAt: 'desc' },
      take: 50,
    });

    res.json(highlights);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch highlights' });
  }
});

router.post('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { childId, title, summary, category, occurredAt, sourceSessionId } = req.body;

    const highlight = await prisma.highlight.create({
      data: {
        childId,
        title,
        summary,
        category,
        occurredAt: new Date(occurredAt),
        sourceSessionId,
      },
    });

    res.status(201).json(highlight);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create highlight' });
  }
});

export default router;
