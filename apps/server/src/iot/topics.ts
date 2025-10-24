import { config } from '../config';

export function buildTopic(deviceId: string, suffix: string): string {
  return `${config.mqttTopicPrefix}/${deviceId}/${suffix}`;
}

export function parseTopic(topic: string): { deviceId: string; type: string } | null {
  const prefix = config.mqttTopicPrefix;
  if (!topic.startsWith(prefix + '/')) {
    return null;
  }

  const parts = topic.substring(prefix.length + 1).split('/');
  if (parts.length < 2) {
    return null;
  }

  const deviceId = parts[0];
  const type = parts.slice(1).join('/');

  return { deviceId, type };
}

export const TopicSuffixes = {
  STATE: 'state',
  TELEMETRY: 'telemetry',
  EVENTS_CHAT: 'events/chat',
  POLICY_ACK: 'policy/ack',
  POLICY_APPLY: 'policy/apply',
  CMD: 'cmd',
};
