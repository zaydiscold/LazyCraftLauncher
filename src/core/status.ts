/**
 * Server status aggregation utilities
 */

import fs from 'fs-extra';
import path from 'path';
import type { ChildProcess } from 'child_process';
import { getPaths } from '../utils/paths.js';
import { logger } from '../utils/log.js';
import { getUptime, isServerRunning } from './run.js';
import type { LazyConfig, NetworkInfo, ServerStatus } from '../types/index.js';

/**
 * Build a snapshot of current server status for UI/API.
 */
export async function getServerStatus(
  config: LazyConfig,
  networkInfo: NetworkInfo | null,
  serverProcess: ChildProcess | null
): Promise<ServerStatus> {
  const running = Boolean(
    serverProcess
      ? serverProcess.exitCode === null && !serverProcess.killed
      : isServerRunning()
  );

  const uptime = getUptime();
  const { players, lastLine } = await extractPlayerState();
  const maxPlayers = await readMaxPlayers();

  return {
    running,
    uptime,
    playersOnline: players.length,
    maxPlayers,
    version: config.minecraftVersion,
    port: config.port,
    reachable: networkInfo?.reachable ?? false,
    statusMessage: running ? 'Online' : 'Offline',
    lastLogLine: lastLine ?? undefined,
  };
}

async function extractPlayerState(): Promise<{ players: string[]; lastLine: string | null }> {
  try {
    const paths = getPaths();
    const latestLog = path.join(paths.root, 'logs', 'latest.log');

    if (!await fs.pathExists(latestLog)) {
      return { players: [], lastLine: null };
    }

    const content = await fs.readFile(latestLog, 'utf-8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    const tail = lines.slice(-500);

    const players = new Set<string>();

    for (const line of tail) {
      const joinMatch = line.match(/\]: (.+?) joined the game/);
      const leaveMatch = line.match(/\]: (.+?) left the game/);

      if (joinMatch) {
        players.add(joinMatch[1]);
      } else if (leaveMatch) {
        players.delete(leaveMatch[1]);
      }
    }

    const lastLine = tail.length > 0 ? tail[tail.length - 1] : null;

    return {
      players: Array.from(players),
      lastLine,
    };
  } catch (error) {
    logger.warn('Failed to parse log for player state:', error);
    return { players: [], lastLine: null };
  }
}

async function readMaxPlayers(): Promise<number> {
  try {
    const paths = getPaths();
    const propertiesPath = path.join(paths.root, 'server.properties');

    if (!await fs.pathExists(propertiesPath)) {
      return 20;
    }

    const content = await fs.readFile(propertiesPath, 'utf-8');
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith('max-players')) {
        const [, value] = line.split('=');
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
    }
  } catch (error) {
    logger.warn('Failed to read max players from server.properties', error);
  }

  return 20;
}
