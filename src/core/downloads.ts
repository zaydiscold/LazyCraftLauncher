/**
 * Download utilities with checksum verification and caching
 */

import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import got from 'got';
import { logger } from '../utils/log.js';

export type ChecksumType = 'sha1' | 'sha256';

export interface DownloadOptions {
  checksum?: string;
  checksumType?: ChecksumType;
  force?: boolean;
  headers?: Record<string, string>;
  timeoutMs?: number;
  onProgress?: (percent: number) => void;
}

/**
 * Download a file to a destination with optional checksum verification.
 */
export async function downloadFile(
  url: string,
  destination: string,
  options: DownloadOptions = {}
): Promise<string> {
  const {
    checksum,
    checksumType = 'sha1',
    force = false,
    headers = {},
    timeoutMs = 60_000,
    onProgress,
  } = options;

  await fs.ensureDir(path.dirname(destination));

  if (!force && await fs.pathExists(destination)) {
    if (!checksum || await verifyChecksum(destination, checksum, checksumType)) {
      logger.info(`Using cached download: ${destination}`);
      return destination;
    }

    logger.warn(`Checksum mismatch for cached file. Redownloading: ${destination}`);
    await fs.remove(destination);
  }

  const tempPath = `${destination}.download`;

  const downloadStream = got.stream(url, {
    headers,
    timeout: { request: timeoutMs },
  });

  downloadStream.on('downloadProgress', progress => {
    if (onProgress) {
      onProgress(progress.percent);
    }
  });

  await new Promise<void>((resolve, reject) => {
    const fileStream = fs.createWriteStream(tempPath);
    fileStream.on('finish', resolve);
    fileStream.on('error', reject);
    downloadStream.on('error', reject);
    downloadStream.pipe(fileStream);
  });

  if (checksum) {
    const valid = await verifyChecksum(tempPath, checksum, checksumType);
    if (!valid) {
      await fs.remove(tempPath);
      throw new Error(`Checksum mismatch for ${url}`);
    }
  }

  await fs.move(tempPath, destination, { overwrite: true });

  return destination;
}

/**
 * Download a file into a cache directory (based on URL hash)
 */
export async function downloadToCache(
  url: string,
  cacheDir: string,
  options: DownloadOptions = {}
): Promise<string> {
  await fs.ensureDir(cacheDir);
  const filename = crypto.createHash('sha1').update(url).digest('hex');
  const destination = path.join(cacheDir, filename);
  await downloadFile(url, destination, options);
  return destination;
}

/**
 * Calculate checksum for a file
 */
export async function calculateChecksum(
  filePath: string,
  type: ChecksumType = 'sha1'
): Promise<string> {
  const hash = crypto.createHash(type);
  const buffer = await fs.readFile(filePath);
  hash.update(buffer);
  return hash.digest('hex');
}

async function verifyChecksum(
  filePath: string,
  expected: string,
  type: ChecksumType
): Promise<boolean> {
  const actual = await calculateChecksum(filePath, type);
  const match = actual.toLowerCase() === expected.toLowerCase();

  if (!match) {
    logger.warn(`Checksum mismatch for ${filePath}: expected ${expected}, got ${actual}`);
  }

  return match;
}
