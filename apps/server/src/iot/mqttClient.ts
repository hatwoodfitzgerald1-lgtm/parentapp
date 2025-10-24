import mqtt from 'mqtt';
import { config } from '../config';
import { logger } from '../logger';
import { parseTopic, TopicSuffixes } from './topics';
import { handleDeviceState, handleDeviceTelemetry, handleChatEvent, handlePolicyAck } from './handlers';

let client: mqtt.MqttClient | null = null;

export async function connectMqtt(): Promise<void> {
  return new Promise((resolve, reject) => {
    client = mqtt.connect(config.mqttBrokerUrl, {
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    });

    client.on('connect', () => {
      logger.info('MQTT client connected');
      const subscribePattern = `${config.mqttTopicPrefix}/+/+`;
      client!.subscribe(subscribePattern, (err) => {
        if (err) {
          logger.error('MQTT subscription failed', err);
        } else {
          logger.info(`Subscribed to ${subscribePattern}`);
        }
      });
      resolve();
    });

    client.on('error', (error) => {
      logger.error('MQTT client error', error);
      reject(error);
    });

    client.on('message', async (topic, message) => {
      try {
        const parsed = parseTopic(topic);
        if (!parsed) {
          return;
        }

        const { deviceId, type } = parsed;
        const payload = JSON.parse(message.toString());

        switch (type) {
          case TopicSuffixes.STATE:
            await handleDeviceState(deviceId, payload);
            break;
          case TopicSuffixes.TELEMETRY:
            await handleDeviceTelemetry(deviceId, payload);
            break;
          case TopicSuffixes.EVENTS_CHAT:
            await handleChatEvent(deviceId, payload);
            break;
          case TopicSuffixes.POLICY_ACK:
            await handlePolicyAck(deviceId, payload);
            break;
          default:
            logger.debug(`Unhandled topic type: ${type}`);
        }
      } catch (error) {
        logger.error('Failed to process MQTT message', { topic, error });
      }
    });

    client.on('reconnect', () => {
      logger.info('MQTT client reconnecting...');
    });

    client.on('close', () => {
      logger.info('MQTT client disconnected');
    });
  });
}

export function publishToDevice(deviceId: string, suffix: string, payload: any): void {
  if (!client || !client.connected) {
    logger.error('MQTT client not connected');
    return;
  }

  const topic = `${config.mqttTopicPrefix}/${deviceId}/${suffix}`;
  client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
    if (err) {
      logger.error(`Failed to publish to ${topic}`, err);
    } else {
      logger.debug(`Published to ${topic}`);
    }
  });
}

export async function disconnectMqtt(): Promise<void> {
  if (client) {
    await client.endAsync();
    logger.info('MQTT client disconnected');
  }
}
