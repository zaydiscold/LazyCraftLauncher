/**
 * Local API Server Module
 * Provides HTTP API for status and control
 */

import Fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { loadConfig, saveConfig, validateConfig } from './config.js';
import { getServerStatus } from './status.js';
import { startServer, stopServer, restartServer, isServerRunning, sendCommand } from './run.js';
import { createBackup } from './backup.js';
import { detectSystem } from './detect.js';
import { loadNetworkInfo } from './network.js';
import { logger } from '../utils/log.js';
import { LIMITS } from '../utils/constants.js';
import type { APIResponse, ActionResult, ServerStatus, NetworkInfo, LazyConfig, SystemInfo } from '../types/index.js';
import { getPaths } from '../utils/paths.js';
import fs from 'fs-extra';
import path from 'path';

const API_PORT = LIMITS.API_PORT;
const API_HOST = LIMITS.API_HOST;

let apiServer: FastifyInstance | null = null;

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

      const networkInfo = await loadNetworkInfo();
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
      } as APIResponse<LazyConfig | null>;
    } catch (error) {
      logger.error('API /config error:', error);
      return {
        success: false,
        error: String(error),
      } as APIResponse<LazyConfig | null>;
    }
  });

  fastify.post('/action/start', async (_request, reply) => {
    const operationId = generateOperationId();
    reply.code(202);

    // Fire-and-forget async operation with error handling
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
    })().catch((error) => {
      // Catch any errors that escape the try-catch (should never happen, but defensive)
      logger.error('Unhandled error in start server operation:', error);
    });

    return {
      operationId,
      status: 'pending',
      message: 'Server start initiated',
    } as ActionResult;
  });

  fastify.post('/action/stop', async (_request, reply) => {
    const operationId = generateOperationId();
    reply.code(202);

    // Fire-and-forget async operation with error handling
    (async () => {
      try {
        await stopServer();
      } catch (error) {
        logger.error('Failed to stop server:', error);
      }
    })().catch((error) => {
      logger.error('Unhandled error in stop server operation:', error);
    });

    return {
      operationId,
      status: 'pending',
      message: 'Server stop initiated',
    } as ActionResult;
  });

  fastify.post('/action/restart', async (_request, reply) => {
    const operationId = generateOperationId();
    reply.code(202);

    // Fire-and-forget async operation with error handling
    (async () => {
      try {
        const config = await loadConfig();
        if (!config) throw new Error('No configuration found');

        await restartServer(config);
      } catch (error) {
        logger.error('Failed to restart server:', error);
      }
    })().catch((error) => {
      logger.error('Unhandled error in restart server operation:', error);
    });

    return {
      operationId,
      status: 'pending',
      message: 'Server restart initiated',
    } as ActionResult;
  });

  fastify.post('/action/backup', async (_request, reply) => {
    const operationId = generateOperationId();
    reply.code(202);

    // Fire-and-forget async operation with error handling
    (async () => {
      try {
        const config = await loadConfig();
        if (!config) throw new Error('No configuration found');

        await createBackup(config.worldPath);
      } catch (error) {
        logger.error('Failed to create backup:', error);
      }
    })().catch((error) => {
      logger.error('Unhandled error in backup operation:', error);
    });

    return {
      operationId,
      status: 'pending',
      message: 'Backup initiated',
    } as ActionResult;
  });

  fastify.post<{ Body: { command: string } }>('/command', async (request, reply) => {
    try {
      const { command } = request.body;
      if (!command) {
        reply.code(400);
        return {
          success: false,
          error: 'Command is required',
        } as APIResponse<{ sent: boolean }>;
      }

      if (!isServerRunning()) {
        reply.code(400);
        return {
          success: false,
          error: 'Server is not running',
        } as APIResponse<{ sent: boolean }>;
      }

      const sent = sendCommand(command);
      return {
        success: sent,
        data: { sent },
      } as APIResponse<{ sent: boolean }>;
    } catch (error) {
      logger.error('API /command error:', error);
      reply.code(500);
      return {
        success: false,
        error: String(error),
      } as APIResponse<{ sent: boolean }>;
    }
  });

  fastify.post<{ Body: LazyConfig }>('/config', async (request, reply) => {
    try {
      const config = request.body;

      // Validate configuration before saving
      const validation = validateConfig(config);
      if (!validation.valid) {
        reply.code(400);
        return {
          success: false,
          error: `Invalid configuration: ${validation.errors.join(', ')}`,
        } as APIResponse<LazyConfig>;
      }

      await saveConfig(config);
      return {
        success: true,
        data: config,
      } as APIResponse<LazyConfig>;
    } catch (error) {
      logger.error('API POST /config error:', error);
      reply.code(500);
      return {
        success: false,
        error: String(error),
      } as APIResponse<LazyConfig>;
    }
  });

  fastify.get('/system', async () => {
    try {
      const systemInfo = await detectSystem();
      return {
        success: true,
        data: systemInfo,
      } as APIResponse<SystemInfo>;
    } catch (error) {
      logger.error('API /system error:', error);
      return {
        success: false,
        error: String(error),
      } as APIResponse<SystemInfo>;
    }
  });

  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Serve static files from web directory
  const webDir = path.join(getPaths().root, 'web');
  if (await fs.pathExists(webDir)) {
    await fastify.register(fastifyStatic, {
      root: webDir,
      prefix: '/',
    });
    logger.info(`Serving web UI from ${webDir}`);
  }

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
