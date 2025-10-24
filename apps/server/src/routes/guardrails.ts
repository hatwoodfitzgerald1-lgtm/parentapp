import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { UpdateGuardrailsRequestSchema, EdgePolicy } from '@parents-app/shared';
import { signPolicy } from '../iot/policySigner';

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

router.get('/:childId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { childId } = req.params;

    if (!(await checkChildAccess(req.user!.id, childId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let policy = await prisma.safetyPolicy.findUnique({
      where: { childId },
    });

    if (!policy) {
      policy = await prisma.safetyPolicy.create({
        data: {
          childId,
          ageRating: 'G',
          blockedKeywords: [],
          cloudVersion: 1,
          deviceVersion: 0,
        },
      });
    }

    res.json(policy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch guardrails' });
  }
});

router.put('/:childId', authenticate, validateBody(UpdateGuardrailsRequestSchema), async (req: AuthRequest, res) => {
  try {
    const { childId } = req.params;

    if (!(await checkChildAccess(req.user!.id, childId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const existing = await prisma.safetyPolicy.findUnique({
      where: { childId },
    });

    const updateData: any = {};
    if (req.body.ageRating !== undefined) updateData.ageRating = req.body.ageRating;
    if (req.body.blockedKeywords !== undefined) updateData.blockedKeywords = req.body.blockedKeywords;
    if (req.body.allowedTopics !== undefined) updateData.allowedTopics = req.body.allowedTopics;
    if (req.body.disallowedTopics !== undefined) updateData.disallowedTopics = req.body.disallowedTopics;
    if (req.body.dailyMinutesMax !== undefined) updateData.dailyMinutesMax = req.body.dailyMinutesMax;
    if (req.body.quietStartMin !== undefined) updateData.quietStartMin = req.body.quietStartMin;
    if (req.body.quietEndMin !== undefined) updateData.quietEndMin = req.body.quietEndMin;
    if (req.body.customInstructions !== undefined) updateData.customInstructions = req.body.customInstructions;

    if (existing) {
      updateData.cloudVersion = existing.cloudVersion + 1;
    } else {
      updateData.cloudVersion = 1;
    }

    const policy = await prisma.safetyPolicy.upsert({
      where: { childId },
      create: {
        childId,
        ...updateData,
      },
      update: updateData,
    });

    res.json(policy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update guardrails' });
  }
});

router.get('/:childId/effective-policy', authenticate, async (req: AuthRequest, res) => {
  try {
    const { childId } = req.params;

    if (!(await checkChildAccess(req.user!.id, childId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const policy = await prisma.safetyPolicy.findUnique({
      where: { childId },
    });

    const scheduleRules = await prisma.scheduleRule.findMany({
      where: { childId },
      orderBy: [{ dayOfWeek: 'asc' }, { startMin: 'asc' }],
    });

    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: { devices: true },
    });

    const deviceId = child?.devices[0]?.id || 'unknown';

    const effectivePolicy: Omit<EdgePolicy, 'signature'> = {
      schemaVersion: 1,
      version: policy?.cloudVersion || 1,
      deviceId,
      childId,
      ageRating: (policy?.ageRating as 'G' | 'PG' | 'PG13') || 'G',
      blockedKeywords: (policy?.blockedKeywords as string[]) || [],
      allowedTopics: policy?.allowedTopics as string[] | undefined,
      disallowedTopics: policy?.disallowedTopics as string[] | undefined,
      quietHours: policy?.quietStartMin !== null && policy?.quietEndMin !== null
        ? { startMin: policy.quietStartMin, endMin: policy.quietEndMin }
        : undefined,
      dailyMinutesMax: policy?.dailyMinutesMax || undefined,
      customInstructions: policy?.customInstructions || undefined,
      issuedAt: new Date().toISOString(),
    };

    const signedPolicy = signPolicy(effectivePolicy);

    res.json(signedPolicy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to compile effective policy' });
  }
});

export default router;
