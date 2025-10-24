import mqtt from 'mqtt';
import * as naclUtil from 'tweetnacl-util';
import {
  DeviceStatePayload,
  DeviceTelemetryPayload,
  ChatEventPayload,
  PolicyAckPayload,
  EdgePolicy,
} from '@parents-app/shared';

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const MQTT_TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || 'toy';
const DEVICE_ID = process.env.DEVICE_ID || 'toy-demo-001';

console.log('=== AI Toy Simulator ===');
console.log(`Device ID: ${DEVICE_ID}`);
console.log(`MQTT Broker: ${MQTT_BROKER_URL}`);
console.log(`Topic Prefix: ${MQTT_TOPIC_PREFIX}`);

const client = mqtt.connect(MQTT_BROKER_URL, {
  clientId: `simulator-${DEVICE_ID}`,
  reconnectPeriod: 5000,
});

let batteryPct = 85;
let playTimeMin = 127;
let adventuresCount = 8;

function publishTopic(suffix: string, payload: any) {
  const topic = `${MQTT_TOPIC_PREFIX}/${DEVICE_ID}/${suffix}`;
  client.publish(topic, JSON.stringify(payload), { qos: 1 });
  console.log(`[PUBLISH] ${topic}`);
}

function publishState() {
  const payload: DeviceStatePayload = {
    status: 'online',
    fwVersion: '1.0.0',
    tpuPresent: true,
    batteryPct,
    childId: 'child-emma-001',
    lastSeen: new Date().toISOString(),
  };
  publishTopic('state', payload);
}

function publishTelemetry() {
  playTimeMin += Math.floor(Math.random() * 5);
  if (Math.random() > 0.7) {
    adventuresCount += 1;
  }
  batteryPct = Math.max(10, batteryPct - Math.floor(Math.random() * 2));

  const payload: DeviceTelemetryPayload = {
    playTimeMin,
    adventuresCount,
  };
  publishTopic('telemetry', payload);
}

function simulateChatSession() {
  const sessionId = `sim-session-${Date.now()}`;
  console.log(`\n[SIMULATE] Starting chat session: ${sessionId}`);

  const messages: Array<{ role: 'CHILD' | 'ASSISTANT'; content: string; delay: number }> = [
    { role: 'CHILD', content: 'Tell me about space!', delay: 1000 },
    { role: 'ASSISTANT', content: 'Space is an amazing place! It\'s where all the stars, planets, and galaxies live. What would you like to know about space?', delay: 2000 },
    { role: 'CHILD', content: 'How many stars are there?', delay: 3000 },
    { role: 'ASSISTANT', content: 'There are billions and billions of stars! In fact, there are so many that we can\'t count them all. Our galaxy, the Milky Way, has about 100 billion stars!', delay: 2500 },
    { role: 'CHILD', content: 'Wow! That\'s a lot! Can we visit them?', delay: 2000 },
    { role: 'ASSISTANT', content: 'Great question! The stars are very, very far away. Even the closest star besides our Sun would take thousands of years to reach with our current spaceships. But maybe one day in the future!', delay: 2500 },
  ];

  let currentTime = Date.now();

  messages.forEach((msg, idx) => {
    setTimeout(() => {
      const payload: ChatEventPayload = {
        sessionId,
        childId: 'child-emma-001',
        role: msg.role,
        content: msg.content,
        ts: new Date().toISOString(),
        tokens: Math.floor(msg.content.split(' ').length * 1.3),
        topicTags: ['space', 'science', 'astronomy'],
      };
      publishTopic('events/chat', payload);
      console.log(`  [${msg.role}] ${msg.content.substring(0, 50)}...`);

      if (idx === messages.length - 1) {
        console.log('[SIMULATE] Chat session complete\n');
      }
    }, messages.slice(0, idx + 1).reduce((sum, m) => sum + m.delay, 0));
  });
}

client.on('connect', () => {
  console.log('\n[MQTT] Connected to broker');

  const policyTopic = `${MQTT_TOPIC_PREFIX}/${DEVICE_ID}/policy/apply`;
  const cmdTopic = `${MQTT_TOPIC_PREFIX}/${DEVICE_ID}/cmd`;

  client.subscribe([policyTopic, cmdTopic], (err) => {
    if (err) {
      console.error('[MQTT] Subscription error:', err);
    } else {
      console.log(`[SUBSCRIBE] ${policyTopic}`);
      console.log(`[SUBSCRIBE] ${cmdTopic}`);
    }
  });

  publishState();
  publishTelemetry();

  setInterval(publishState, 30000);
  setInterval(publishTelemetry, 60000);

  setTimeout(() => {
    simulateChatSession();
  }, 5000);

  setInterval(() => {
    if (Math.random() > 0.7) {
      simulateChatSession();
    }
  }, 120000);
});

client.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());

    if (topic.endsWith('/policy/apply')) {
      const policy = payload as EdgePolicy;
      console.log(`\n[POLICY] Received policy version ${policy.version}`);
      console.log(`  Age Rating: ${policy.ageRating}`);
      console.log(`  Blocked Keywords: ${policy.blockedKeywords.length}`);
      console.log(`  Daily Max: ${policy.dailyMinutesMax || 'unlimited'} minutes`);

      if (policy.signature) {
        console.log(`  Signature: ${policy.signature.sigBase64.substring(0, 20)}...`);
      }

      const ackPayload: PolicyAckPayload = {
        policyVersion: policy.version,
        ok: true,
        appliedAt: new Date().toISOString(),
      };

      setTimeout(() => {
        publishTopic('policy/ack', ackPayload);
        console.log(`[ACK] Policy version ${policy.version} applied\n`);
      }, 500);
    } else if (topic.endsWith('/cmd')) {
      console.log(`\n[CMD] Received command: ${payload.type}`);
      console.log(`  ID: ${payload.id}`);
      console.log(`  Args:`, payload.args);
      console.log('');
    }
  } catch (error) {
    console.error('[ERROR] Failed to process message:', error);
  }
});

client.on('error', (error) => {
  console.error('[MQTT] Error:', error);
});

client.on('reconnect', () => {
  console.log('[MQTT] Reconnecting...');
});

client.on('close', () => {
  console.log('[MQTT] Disconnected');
});

process.on('SIGINT', () => {
  console.log('\n[SHUTDOWN] Stopping simulator...');
  client.end();
  process.exit(0);
});
