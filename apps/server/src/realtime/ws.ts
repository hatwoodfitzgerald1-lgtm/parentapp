import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../logger';

export let io: Server | null = null;

export function initializeWebSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    path: '/realtime',
    cors: {
      origin: [config.corsOrigin, config.websocketOrigin],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, config.jwtSecret) as {
        userId: string;
        email: string;
        role: string;
      };

      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    logger.info(`WebSocket client connected: ${userId}`);

    socket.join(`user:${userId}`);

    socket.on('subscribe:device', (deviceId: string) => {
      socket.join(`device:${deviceId}`);
      logger.debug(`User ${userId} subscribed to device ${deviceId}`);
    });

    socket.on('unsubscribe:device', (deviceId: string) => {
      socket.leave(`device:${deviceId}`);
      logger.debug(`User ${userId} unsubscribed from device ${deviceId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${userId}`);
    });
  });

  logger.info('WebSocket server initialized');
}
