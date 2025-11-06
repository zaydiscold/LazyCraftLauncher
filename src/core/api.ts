/**
 * Local API Server Module
 * Provides HTTP API for status and control
 */

import Fastify from 'fastify';
import { loadConfig } from './config.js';
import { getServerStatus } from './status.js';
import { startServer, stopServer, restartServer, isServerRunning } from './run.js';
import { createBackup } from './backup.js';
import { logger } from '../utils/log.js';
import type { APIResponse, ActionResult, ServerStatus, NetworkInfo } from '../types/index.js';
import { getPaths } from '../utils/paths.js';
import fs from 'fs-extra';
import path from 'path';

const API_PORT = 8765;
const API_HOST = '127.0.0.1';

let apiServer: any = null;

export async function startAPI(): Promise<void> {
  if (apiServer) {
    logger.warn('API server already running');
    return;
  }

  const fastify = Fastify({ logger: false });

  fastify.addHook('onRequest', async (request, reply) => {
    const ip = request.ip;
    if (ip !== '127.0.0.1' && ip !== '::1' && !ip.startsWith('127.')) {
      reply.code(403).send({ error: 'Forbidden: Local access only' });
    }
  });

  fastify.get('/status', async () => {
    try {
      const config = await loadConfig();
      if (!config) {
        return {
          success: false,
          error: 'No configuration found',
        } as APIResponse<ServerStatus>;
      }

      const networkInfo = await readNetworkInfo();
      const status = await getServerStatus(config, networkInfo, null);

      return {
        success: true,
        data: status,
      } as APIResponse<ServerStatus>;
    } catch (error) {
      logger.error('API /status error:', error);
      return {
        success: false,
        error: String(error),
      } as APIResponse<ServerStatus>;
    }
  });

  fastify.get('/config', async () => {
    try {
      const config = await loadConfig();
      return {
        success: true,
        data: config,
      } as APIResponse<any>;
    } catch (error) {
      logger.error('API /config error:', error);
      return {
        success: false,
        error: String(error),
      } as APIResponse<any>;
    }
  });

  fastify.post('/action/start', async (_request, reply) => {
    const operationId = generateOperationId();
    reply.code(202);

    (async () => {
      try {
        const config = await loadConfig();
        if (!config) throw new Error('No configuration found');

        if (!isServerRunning()) {
          await startServer(config);
        }
      } catch (error) {
        logger.error('Failed to start server:', error);
      }
    })();

    return {
      operationId,
      status: 'pending',
      message: 'Server start initiated',
    } as ActionResult;
  });

  fastify.post('/action/stop', async (_request, reply) => {
    const operationId = generateOperationId();
    reply.code(202);

    (async () => {
      try {
        await stopServer();
      } catch (error) {
        logger.error('Failed to stop server:', error);
      }
    })();

    return {
      operationId,
      status: 'pending',
      message: 'Server stop initiated',
    } as ActionResult;
  });

  fastify.post('/action/restart', async (_request, reply) => {
    const operationId = generateOperationId();
    reply.code(202);

    (async () => {
      try {
        const config = await loadConfig();
        if (!config) throw new Error('No configuration found');

        await restartServer(config);
      } catch (error) {
        logger.error('Failed to restart server:', error);
      }
    })();

    return {
      operationId,
      status: 'pending',
      message: 'Server restart initiated',
    } as ActionResult;
  });

  fastify.post('/action/backup', async (_request, reply) => {
    const operationId = generateOperationId();
    reply.code(202);

    (async () => {
      try {
        const config = await loadConfig();
        if (!config) throw new Error('No configuration found');

        await createBackup(config.worldPath);
      } catch (error) {
        logger.error('Failed to create backup:', error);
      }
    })();

    return {
      operationId,
      status: 'pending',
      message: 'Backup initiated',
    } as ActionResult;
  });

  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  try {
    await fastify.listen({ port: API_PORT, host: API_HOST });
    apiServer = fastify;
    logger.info(`API server listening on http://${API_HOST}:${API_PORT}`);
  } catch (error) {
    logger.error('Failed to start API server:', error);
    throw error;
  }
}

export async function stopAPI(): Promise<void> {
  if (apiServer) {
    await apiServer.close();
    apiServer = null;
    logger.info('API server stopped');
  }
}

function generateOperationId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function readNetworkInfo(): Promise<NetworkInfo | null> {
  try {
    const paths = getPaths();
    const infoPath = path.join(paths.root, '.network-info.json');
    if (await fs.pathExists(infoPath)) {
      return await fs.readJson(infoPath) as NetworkInfo;
    }
  } catch (error) {
    logger.warn('Failed to read network info for API:', error);
  }
  return null;
}
