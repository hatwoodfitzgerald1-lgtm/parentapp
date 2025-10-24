export type Role = 'ADMIN' | 'PARENT';
export type ChatRole = 'CHILD' | 'ASSISTANT' | 'PARENT' | 'SYSTEM';
export type CoachRole = 'PARENT' | 'ASSISTANT' | 'SYSTEM';
export type HighlightCategory = 'Curiosity' | 'Creativity' | 'SocialSkills' | 'Emotions' | 'Learning' | 'Other';
export type AgeRating = 'G' | 'PG' | 'PG13';

export interface EdgePolicy {
  schemaVersion: 1;
  version: number;
  deviceId: string;
  childId: string;
  ageRating: AgeRating;
  blockedKeywords: string[];
  allowedTopics?: string[];
  disallowedTopics?: string[];
  quietHours?: { startMin: number; endMin: number };
  dailyMinutesMax?: number;
  customInstructions?: string;
  issuedAt: string;
  signature?: { alg: 'Ed25519'; keyId?: string; sigBase64: string };
}

export interface DeviceStatePayload {
  status: string;
  fwVersion: string;
  tpuPresent: boolean;
  batteryPct: number;
  childId?: string;
  lastSeen: string;
}

export interface DeviceTelemetryPayload {
  playTimeMin: number;
  adventuresCount: number;
}

export interface ChatEventPayload {
  sessionId: string;
  childId: string;
  role: ChatRole;
  content: string;
  ts: string;
  tokens?: number;
  topicTags?: string[];
  safetyHits?: string[];
}

export interface PolicyAckPayload {
  policyVersion: number;
  ok: boolean;
  appliedAt: string;
}

export interface DeviceCommandPayload {
  id: string;
  type: 'ping' | 'say' | 'reboot' | 'ota_check';
  args: Record<string, unknown>;
}

export interface BLEPairingRequest {
  parentPubKey: string;
  nonce: string;
}

export interface BLEPairingResponse {
  toyPubKey: string;
  signature: string;
}

export interface BLEDeviceInfo {
  fwVersion: string;
  hwRev: string;
  tpuOk: boolean;
  batteryPct: number;
}
