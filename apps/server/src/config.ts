import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtAccessExpiry: '15m',
  jwtRefreshExpiry: '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  websocketOrigin: process.env.WEBSOCKET_ORIGIN || 'http://localhost:5173',
  mqttBrokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
  mqttTopicPrefix: process.env.MQTT_TOPIC_PREFIX || 'toy',
  edgePolicySignSecret: process.env.EDGE_POLICY_SIGN_SECRET || '',
  edgePolicySignPublic: process.env.EDGE_POLICY_SIGN_PUBLIC || '',
  deviceSimulator: process.env.DEVICE_SIMULATOR === '1',
};
