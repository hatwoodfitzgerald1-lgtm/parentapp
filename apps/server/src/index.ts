import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './logger';
import { connectDb, disconnectDb } from './db';
import { initializePolicySigner } from './iot/policySigner';
import { startInProcessBroker } from './iot/broker';
import { connectMqtt, disconnectMqtt } from './iot/mqttClient';
import { initializeWebSocket } from './realtime/ws';

import authRoutes from './routes/auth';
import childrenRoutes from './routes/children';
import conversationsRoutes from './routes/conversations';
import highlightsRoutes from './routes/highlights';
import guardrailsRoutes from './routes/guardrails';
import devicesRoutes from './routes/devices';
import exportRoutes from './routes/export';

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP',
});
app.use(limiter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/highlights', highlightsRoutes);
app.use('/api/children/:childId/guardrails', guardrailsRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/export', exportRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await connectDb();
    
    initializePolicySigner();

    if (config.mqttBrokerUrl.includes('localhost')) {
      await startInProcessBroker(1883);
    }

    await connectMqtt();

    initializeWebSocket(server);

    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

async function shutdown() {
  logger.info('Shutting down gracefully...');
  await disconnectMqtt();
  await disconnectDb();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
