import { z } from 'zod';

export const EdgePolicySchema = z.object({
  schemaVersion: z.literal(1),
  version: z.number(),
  deviceId: z.string(),
  childId: z.string(),
  ageRating: z.enum(['G', 'PG', 'PG13']),
  blockedKeywords: z.array(z.string()),
  allowedTopics: z.array(z.string()).optional(),
  disallowedTopics: z.array(z.string()).optional(),
  quietHours: z.object({
    startMin: z.number(),
    endMin: z.number(),
  }).optional(),
  dailyMinutesMax: z.number().optional(),
  customInstructions: z.string().optional(),
  issuedAt: z.string(),
  signature: z.object({
    alg: z.literal('Ed25519'),
    keyId: z.string().optional(),
    sigBase64: z.string(),
  }).optional(),
});

export const DeviceStatePayloadSchema = z.object({
  status: z.string(),
  fwVersion: z.string(),
  tpuPresent: z.boolean(),
  batteryPct: z.number(),
  childId: z.string().optional(),
  lastSeen: z.string(),
});

export const DeviceTelemetryPayloadSchema = z.object({
  playTimeMin: z.number(),
  adventuresCount: z.number(),
});

export const ChatEventPayloadSchema = z.object({
  sessionId: z.string(),
  childId: z.string(),
  role: z.enum(['CHILD', 'ASSISTANT', 'PARENT', 'SYSTEM']),
  content: z.string(),
  ts: z.string(),
  tokens: z.number().optional(),
  topicTags: z.array(z.string()).optional(),
  safetyHits: z.array(z.string()).optional(),
});

export const PolicyAckPayloadSchema = z.object({
  policyVersion: z.number(),
  ok: z.boolean(),
  appliedAt: z.string(),
});

export const DeviceCommandPayloadSchema = z.object({
  id: z.string(),
  type: z.enum(['ping', 'say', 'reboot', 'ota_check']),
  args: z.record(z.unknown()),
});

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});

export const UpdateChildRequestSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  birthday: z.string().optional(),
  className: z.string().optional(),
  photoUrl: z.string().url().optional(),
});

export const UpdateGuardrailsRequestSchema = z.object({
  ageRating: z.enum(['G', 'PG', 'PG13']).optional(),
  blockedKeywords: z.array(z.string()).optional(),
  allowedTopics: z.array(z.string()).optional(),
  disallowedTopics: z.array(z.string()).optional(),
  dailyMinutesMax: z.number().optional(),
  quietStartMin: z.number().optional(),
  quietEndMin: z.number().optional(),
  customInstructions: z.string().optional(),
});

export const PairDeviceRequestSchema = z.object({
  deviceId: z.string(),
  childId: z.string().optional(),
});

export const SendCommandRequestSchema = z.object({
  type: z.enum(['ping', 'say', 'reboot', 'ota_check']),
  args: z.record(z.unknown()).optional(),
});
