import aedes from 'aedes';
import { createServer } from 'net';
import { logger } from '../logger';

let aedesInstance: aedes.Aedes | null = null;
let server: ReturnType<typeof createServer> | null = null;

export async function startInProcessBroker(port: number = 1883): Promise<void> {
  try {
    aedesInstance = aedes();
    server = createServer(aedesInstance.handle);

    await new Promise<void>((resolve, reject) => {
      server!.listen(port, () => {
        logger.info(`In-process MQTT broker started on port ${port}`);
        resolve();
      });

      server!.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          logger.info(`Port ${port} already in use, assuming external broker`);
          resolve();
        } else {
          reject(err);
        }
      });
    });

    if (aedesInstance) {
      aedesInstance.on('client', (client) => {
        logger.debug(`MQTT client connected: ${client.id}`);
      });

      aedesInstance.on('publish', (packet, client) => {
        if (client) {
          logger.debug(`Message published to ${packet.topic}`);
        }
      });
    }
  } catch (error) {
    logger.error('Failed to start in-process MQTT broker', error);
  }
}

export async function stopInProcessBroker(): Promise<void> {
  if (server) {
    await new Promise<void>((resolve) => {
      server!.close(() => {
        logger.info('In-process MQTT broker stopped');
        resolve();
      });
    });
  }
  if (aedesInstance) {
    await aedesInstance.close();
  }
}
