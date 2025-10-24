import { prisma } from '../db';
import { logger } from '../logger';
import {
  DeviceStatePayload,
  DeviceTelemetryPayload,
  ChatEventPayload,
  PolicyAckPayload,
} from '@parents-app/shared';
import { io } from '../realtime/ws';

export async function handleDeviceState(deviceId: string, payload: DeviceStatePayload) {
  try {
    const device = await prisma.device.update({
      where: { id: deviceId },
      data: {
        status: payload.status,
        firmwareVersion: payload.fwVersion,
        tpuPresent: payload.tpuPresent,
        batteryPct: payload.batteryPct,
        lastSeen: new Date(payload.lastSeen),
      },
    });

    await prisma.deviceEvent.create({
      data: {
        deviceId,
        type: 'state',
        payload: payload as any,
      },
    });

    if (io) {
      io.to(`device:${deviceId}`).emit('device:update', device);
      if (device.ownerId) {
        io.to(`user:${device.ownerId}`).emit('device:update', device);
      }
    }

    logger.info(`Device state updated: ${deviceId}`);
  } catch (error) {
    logger.error(`Failed to handle device state for ${deviceId}`, error);
  }
}

export async function handleDeviceTelemetry(deviceId: string, payload: DeviceTelemetryPayload) {
  try {
    const device = await prisma.device.update({
      where: { id: deviceId },
      data: {
        playTimeMin: payload.playTimeMin,
        adventuresCount: payload.adventuresCount,
      },
    });

    await prisma.deviceEvent.create({
      data: {
        deviceId,
        type: 'telemetry',
        payload: payload as any,
      },
    });

    if (io) {
      io.to(`device:${deviceId}`).emit('device:update', device);
      if (device.ownerId) {
        io.to(`user:${device.ownerId}`).emit('device:update', device);
      }
    }

    logger.info(`Device telemetry updated: ${deviceId}`);
  } catch (error) {
    logger.error(`Failed to handle device telemetry for ${deviceId}`, error);
  }
}

export async function handleChatEvent(deviceId: string, payload: ChatEventPayload) {
  try {
    let session = await prisma.childChatSession.findFirst({
      where: { id: payload.sessionId },
    });

    if (!session) {
      session = await prisma.childChatSession.create({
        data: {
          id: payload.sessionId,
          childId: payload.childId,
          source: 'toy',
          deviceId,
        },
      });
    }

    const message = await prisma.childChatMessage.create({
      data: {
        sessionId: payload.sessionId,
        role: payload.role,
        content: payload.content,
        createdAt: new Date(payload.ts),
        tokens: payload.tokens,
        topicTags: payload.topicTags as any,
        safetyHits: payload.safetyHits as any,
      },
    });

    await prisma.deviceEvent.create({
      data: {
        deviceId,
        type: 'chat',
        payload: payload as any,
      },
    });

    if (io) {
      const device = await prisma.device.findUnique({ where: { id: deviceId } });
      if (device?.ownerId) {
        io.to(`user:${device.ownerId}`).emit('conversation:update', { sessionId: session.id, message });
      }
    }

    logger.info(`Chat event processed for session ${payload.sessionId}`);
  } catch (error) {
    logger.error(`Failed to handle chat event for ${deviceId}`, error);
  }
}

export async function handlePolicyAck(deviceId: string, payload: PolicyAckPayload) {
  try {
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        policyVersion: payload.ok ? payload.policyVersion : undefined,
      },
    });

    await prisma.deviceEvent.create({
      data: {
        deviceId,
        type: 'policy_ack',
        payload: payload as any,
      },
    });

    if (io) {
      const device = await prisma.device.findUnique({ where: { id: deviceId } });
      if (device?.ownerId) {
        io.to(`user:${device.ownerId}`).emit('device:policy_ack', { deviceId, payload });
      }
    }

    logger.info(`Policy ack received for ${deviceId}: version ${payload.policyVersion}, ok=${payload.ok}`);
  } catch (error) {
    logger.error(`Failed to handle policy ack for ${deviceId}`, error);
  }
}
