/**
 * System detection helpers
 */

import os from 'os';
import path from 'path';
import { execa } from 'execa';
import fs from 'fs-extra';
import { logger } from '../utils/log.js';
import type { SystemInfo, SupportedOS } from '../types/index.js';

/**
 * Gather system information required for setup
 */
export async function detectSystem(): Promise<SystemInfo> {
  const platform = process.platform;
  const osLabel = mapPlatformToOS(platform);
  const arch = os.arch();

  const totalRAMGB = bytesToGB(os.totalmem());
  const availableRAMGB = bytesToGB(os.freemem());

  const javaInfo = await detectJavaExecutable();

  const systemInfo: SystemInfo = {
    os: osLabel,
    platform,
    arch,
    totalRAMGB,
    availableRAMGB,
    javaInstalled: javaInfo.found,
    javaVersion: javaInfo.version,
    javaPath: javaInfo.path,
  };

  logger.info('Detected system:', systemInfo);

  return systemInfo;
}

/**
 * Determine if a Java version is compatible (needs 17+)
 */
export function isJavaCompatible(version?: string | null): boolean {
  if (!version) {
    return false;
  }

  const match = version.match(/(\d+)(\.(\d+))?/);
  if (!match) {
    return false;
  }

  let major = Number(match[1]);
  if (major === 1 && match[3]) {
    major = Number(match[3]); // Handle legacy "1.x"
  }

  return major >= 17;
}

/**
 * Returns first non-internal IPv4 address, fallback to localhost.
 */
export function getLocalIP(): string {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    const entries = interfaces[name];
    if (!entries) continue;

    for (const entry of entries) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }

  return '127.0.0.1';
}

/**
 * Detect Java executable on the system.
 */
async function detectJavaExecutable(): Promise<{
  found: boolean;
  version?: string;
  path?: string;
}> {
  const candidates: string[] = [];

  const javaHome = process.env.JAVA_HOME;
  if (javaHome) {
    const exe = process.platform === 'win32' ? 'java.exe' : 'java';
    const javaFromHome = path.join(javaHome, 'bin', exe);
    candidates.push(javaFromHome);
  }

  // PATH lookup
  const locator = process.platform === 'win32' ? 'where' : 'which';
  try {
    const { stdout } = await execa(locator, ['java'], { reject: false });
    if (stdout) {
      stdout
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .forEach(line => candidates.push(line));
    }
  } catch {
    // ignore
  }

  // Default command
  candidates.push('java');

  for (const candidate of candidates) {
    const info = await validateJavaCandidate(candidate);
    if (info) {
      return {
        found: true,
        version: info.version,
        path: info.path,
      };
    }
  }

  return { found: false };
}

/**
 * Validate a Java command by executing `-version`
 */
async function validateJavaCandidate(candidate: string): Promise<{ version: string; path: string } | null> {
  try {
    // Ensure file exists if absolute path
    if (candidate !== 'java' && !(await fs.pathExists(candidate))) {
      return null;
    }

    const { stderr } = await execa(candidate, ['-version'], { reject: false });
    const output = stderr.toString();

    const versionMatch = output.match(/version "(.+?)"/);
    if (!versionMatch) {
      return null;
    }

    const version = versionMatch[1];

    return {
      version,
      path: candidate,
    };
  } catch (error) {
    logger.debug('Java candidate failed:', candidate, error);
    return null;
  }
}

function mapPlatformToOS(platform: NodeJS.Platform): SupportedOS {
  switch (platform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'mac';
    default:
      return 'linux';
  }
}

function bytesToGB(bytes: number): number {
  return Math.round((bytes / 1024 / 1024 / 1024) * 10) / 10;
}
