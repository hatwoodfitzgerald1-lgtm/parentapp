import { Router } from 'express';
import { v4 as uuidv4 } from 'crypto';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { PairDeviceRequestSchema, SendCommandRequestSchema, EdgePolicy } from '@parents-app/shared';
import { publishToDevice } from '../iot/mqttClient';
import { TopicSuffixes } from '../iot/topics';
import { signPolicy } from '../iot/policySigner';

const router = Router();

router.post('/pair', authenticate, validateBody(PairDeviceRequestSchema), async (req: AuthRequest, res) => {
  try {
    const { deviceId, childId } = req.body;

    const existing = await prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (existing) {
      return res.status(400).json({ error: 'Device already paired' });
    }

    const device = await prisma.device.create({
      data: {
        id: deviceId,
        ownerId: req.user!.id,
        childId: childId || null,
        displayName: `Device ${deviceId}`,
      },
    });

    res.status(201).json(device);
  } catch (error) {
    res.status(500).json({ error: 'Failed to pair device' });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const devices = await prisma.device.findMany({
      where: { ownerId: req.user!.id },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

router.get('/:deviceId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { deviceId } = req.params;

    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        ownerId: req.user!.id,
      },
      include: {
        child: true,
      },
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch device' });
  }
});

router.post('/:deviceId/commands', authenticate, validateBody(SendCommandRequestSchema), async (req: AuthRequest, res) => {
  try {
    const { deviceId } = req.params;

    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        ownerId: req.user!.id,
      },
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const command = {
      id: uuidv4(),
      type: req.body.type,
      args: req.body.args || {},
    };

    publishToDevice(deviceId, TopicSuffixes.CMD, command);

    res.json({ success: true, command });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send command' });
  }
});

router.post('/:deviceId/policy/push', authenticate, async (req: AuthRequest, res) => {
  try {
    const { deviceId } = req.params;

    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        ownerId: req.user!.id,
      },
      include: { child: true },
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (!device.childId) {
      return res.status(400).json({ error: 'Device not linked to a child' });
    }

    const policy = await prisma.safetyPolicy.findUnique({
      where: { childId: device.childId },
    });

    if (!policy) {
      return res.status(404).json({ error: 'No policy found for this child' });
    }

    const effectivePolicy: Omit<EdgePolicy, 'signature'> = {
      schemaVersion: 1,
      version: policy.cloudVersion,
      deviceId,
      childId: device.childId,
      ageRating: (policy.ageRating as 'G' | 'PG' | 'PG13') || 'G',
      blockedKeywords: (policy.blockedKeywords as string[]) || [],
      allowedTopics: policy.allowedTopics as string[] | undefined,
      disallowedTopics: policy.disallowedTopics as string[] | undefined,
      quietHours: policy.quietStartMin !== null && policy.quietEndMin !== null
        ? { startMin: policy.quietStartMin, endMin: policy.quietEndMin }
        : undefined,
      dailyMinutesMax: policy.dailyMinutesMax || undefined,
      customInstructions: policy.customInstructions || undefined,
      issuedAt: new Date().toISOString(),
    };

    const signedPolicy = signPolicy(effectivePolicy);

    publishToDevice(deviceId, TopicSuffixes.POLICY_APPLY, signedPolicy);

    res.json({ success: true, policy: signedPolicy });
  } catch (error) {
    res.status(500).json({ error: 'Failed to push policy' });
  }
});

router.get('/:deviceId/health', authenticate, async (req: AuthRequest, res) => {
  try {
    const { deviceId } = req.params;

    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        ownerId: req.user!.id,
      },
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const recentEvents = await prisma.deviceEvent.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      device,
      recentEvents,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch device health' });
  }
});

router.get('/:deviceId/export/events.csv', authenticate, async (req: AuthRequest, res) => {
  try {
    const { deviceId } = req.params;

    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        ownerId: req.user!.id,
      },
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const events = await prisma.deviceEvent.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'asc' },
    });

    const csv = [
      'timestamp,type,payload',
      ...events.map((e) =>
        `${e.createdAt.toISOString()},${e.type},"${JSON.stringify(e.payload).replace(/"/g, '""')}"`
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="device-${deviceId}-events.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export events' });
  }
});

export default router;
