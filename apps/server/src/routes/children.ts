import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { UpdateChildRequestSchema } from '@parents-app/shared';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const parentChildren = await prisma.parentChild.findMany({
      where: { parentId: req.user!.id },
      include: {
        child: {
          include: {
            policy: true,
          },
        },
      },
    });

    const children = parentChildren.map((pc) => pc.child);
    res.json(children);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const parentChild = await prisma.parentChild.findUnique({
      where: {
        parentId_childId: {
          parentId: req.user!.id,
          childId: id,
        },
      },
      include: {
        child: {
          include: {
            policy: true,
            scheduleRules: true,
          },
        },
      },
    });

    if (!parentChild) {
      return res.status(404).json({ error: 'Child not found' });
    }

    res.json(parentChild.child);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch child' });
  }
});

router.put('/:id', authenticate, validateBody(UpdateChildRequestSchema), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const parentChild = await prisma.parentChild.findUnique({
      where: {
        parentId_childId: {
          parentId: req.user!.id,
          childId: id,
        },
      },
    });

    if (!parentChild) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const child = await prisma.child.update({
      where: { id },
      data: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        birthday: req.body.birthday ? new Date(req.body.birthday) : undefined,
        className: req.body.className,
        photoUrl: req.body.photoUrl,
      },
      include: {
        policy: true,
      },
    });

    res.json(child);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update child' });
  }
});

export default router;
