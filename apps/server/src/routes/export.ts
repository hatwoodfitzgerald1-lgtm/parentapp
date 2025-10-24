import { Router } from 'express';
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

router.get('/child/:childId/conversations.json', authenticate, async (req: AuthRequest, res) => {
  try {
    const { childId } = req.params;

    if (!(await checkChildAccess(req.user!.id, childId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const sessions = await prisma.childChatSession.findMany({
      where: { childId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="conversations-${childId}.json"`);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});

router.get('/child/:childId/conversations.csv', authenticate, async (req: AuthRequest, res) => {
  try {
    const { childId } = req.params;

    if (!(await checkChildAccess(req.user!.id, childId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const sessions = await prisma.childChatSession.findMany({
      where: { childId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    const rows: string[] = ['session_id,started_at,message_id,timestamp,role,content'];

    for (const session of sessions) {
      for (const msg of session.messages) {
        const content = msg.content.replace(/"/g, '""');
        rows.push(
          `${session.id},${session.startedAt.toISOString()},${msg.id},${msg.createdAt.toISOString()},${msg.role},"${content}"`
        );
      }
    }

    const csv = rows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="conversations-${childId}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});

export default router;
