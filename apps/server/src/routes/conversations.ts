import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

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

router.post('/:childId/sessions', authenticate, async (req: AuthRequest, res) => {
  try {
    const { childId } = req.params;

    if (!(await checkChildAccess(req.user!.id, childId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const session = await prisma.childChatSession.create({
      data: {
        childId,
        source: req.body.source || 'mobile',
      },
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.get('/:childId/sessions', authenticate, async (req: AuthRequest, res) => {
  try {
    const { childId } = req.params;

    if (!(await checkChildAccess(req.user!.id, childId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const sessions = await prisma.childChatSession.findMany({
      where: { childId },
      orderBy: { startedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.get('/:childId/sessions/:sid/messages', authenticate, async (req: AuthRequest, res) => {
  try {
    const { childId, sid } = req.params;

    if (!(await checkChildAccess(req.user!.id, childId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const session = await prisma.childChatSession.findFirst({
      where: { id: sid, childId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messages = await prisma.childChatMessage.findMany({
      where: { sessionId: sid },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/:childId/sessions/:sid/messages', authenticate, async (req: AuthRequest, res) => {
  try {
    const { childId, sid } = req.params;

    if (!(await checkChildAccess(req.user!.id, childId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const message = await prisma.childChatMessage.create({
      data: {
        sessionId: sid,
        role: req.body.role || 'PARENT',
        content: req.body.content,
      },
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create message' });
  }
});

router.get('/search', authenticate, async (req: AuthRequest, res) => {
  try {
    const { childId, q, from, to, role } = req.query as {
      childId?: string;
      q?: string;
      from?: string;
      to?: string;
      role?: string;
    };

    if (childId && !(await checkChildAccess(req.user!.id, childId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const where: any = {};

    if (childId) {
      where.session = { childId };
    }

    if (q) {
      where.content = { contains: q };
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    if (role) {
      where.role = role;
    }

    const messages = await prisma.childChatMessage.findMany({
      where,
      include: {
        session: {
          include: {
            child: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
