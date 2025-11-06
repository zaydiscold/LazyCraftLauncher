/**
 * Java Management Module
 * Ensures Java 17+ is available, downloads if needed
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import got from 'got';
import AdmZip from 'adm-zip';
import { execa } from 'execa';
import { getPaths } from '../utils/paths.js';
import { logger } from '../utils/log.js';
import { isJavaCompatible } from './detect.js';
import type { SystemInfo } from '../types/index.js';

const ADOPTIUM_API = 'https://api.adoptium.net/v3';

/**
 * Ensure Java is available
 */
export async function ensureJava(systemInfo: SystemInfo): Promise<string> {
  logger.info('Checking Java installation...');

  if (systemInfo.javaInstalled && isJavaCompatible(systemInfo.javaVersion)) {
    logger.info(`Found compatible Java: ${systemInfo.javaVersion}`);
    return systemInfo.javaPath!;
  }

  const paths = getPaths();
  const localJavaPath = await findLocalJava(paths.jre);
  if (localJavaPath) {
    logger.info('Found local Java installation');
    return localJavaPath;
  }

  console.log('No Java found. Classic. Sit tight, I\'ll fetch it.');
  logger.info('Downloading Java from Adoptium...');

  const javaPath = await downloadJava(systemInfo.os);
  logger.info(`Java installed to: ${javaPath}`);

  return javaPath;
}

async function findLocalJava(jreDir: string): Promise<string | null> {
  try {
    const javaExe = os.platform() === 'win32' ? 'java.exe' : 'java';
    const javaPath = path.join(jreDir, 'bin', javaExe);

    if (await fs.pathExists(javaPath)) {
      const { stderr } = await execa(javaPath, ['-version'], { reject: false });
      if (stderr && stderr.includes('version')) {
        const versionMatch = stderr.match(/version "(.+?)"/);
        const version = versionMatch ? versionMatch[1] : undefined;

        if (isJavaCompatible(version)) {
          return javaPath;
        }
      }
    }
  } catch (error) {
    logger.error('Error checking local Java:', error);
  }

  return null;
}

async function downloadJava(osType: 'windows' | 'mac' | 'linux'): Promise<string> {
  const paths = getPaths();
  await fs.ensureDir(paths.jre);

  const platform = osType === 'windows' ? 'windows' : osType === 'mac' ? 'mac' : 'linux';
  const arch = os.arch() === 'arm64' ? 'aarch64' : 'x64';
  const imageType = 'jre';

  const downloadUrl = await getAdoptiumDownloadUrl(platform, arch, imageType);

  if (!downloadUrl) {
    throw new Error('Failed to get Java download URL');
  }

  const archivePath = path.join(paths.temp, `java.${osType === 'windows' ? 'zip' : 'tar.gz'}`);
  await downloadFile(downloadUrl, archivePath);
  await extractJava(archivePath, paths.jre, osType);
  await fs.remove(archivePath);

  const javaExe = osType === 'windows' ? 'java.exe' : 'java';
  const directories = await fs.readdir(paths.jre);

  for (const dir of directories) {
    const javaPath = path.join(paths.jre, dir, 'bin', javaExe);
    if (await fs.pathExists(javaPath)) {
      return javaPath;
    }
  }

  const directPath = path.join(paths.jre, 'bin', javaExe);
  if (await fs.pathExists(directPath)) {
    return directPath;
  }

  throw new Error('Failed to find Java executable after extraction');
}

async function getAdoptiumDownloadUrl(
  platform: string,
  arch: string,
  imageType: string
): Promise<string | null> {
  try {
    const osName = platform === 'mac' ? 'mac' : platform;

    // Try the latest endpoint first - returns array with binary.package.link
    const latestUrl = `${ADOPTIUM_API}/assets/latest/21/hotspot?architecture=${arch}&image_type=${imageType}&os=${osName}&vendor=eclipse`;

    logger.info(`Fetching Java from: ${latestUrl}`);

    const latestResponse = await got(latestUrl, {
      responseType: 'json',
      timeout: { request: 30000 },
    });

    const latestData = latestResponse.body as any;

    // Check if we got a direct download link from the latest endpoint
    if (Array.isArray(latestData) && latestData.length > 0 && latestData[0].binary?.package?.link) {
      const downloadUrl = latestData[0].binary.package.link as string;
      logger.info(`Found download URL from latest endpoint: ${downloadUrl}`);
      return downloadUrl;
    }

    // Fallback to feature_releases endpoint - returns array with binaries[].package.link
    const listUrl = `${ADOPTIUM_API}/assets/feature_releases/21/ga?architecture=${arch}&image_type=${imageType}&os=${osName}&vendor=eclipse&page_size=1`;

    logger.info(`Trying fallback endpoint: ${listUrl}`);

    const listResponse = await got(listUrl, {
      responseType: 'json',
      timeout: { request: 30000 },
    });
    const data = listResponse.body as any;

    // Note: feature_releases returns data[0].binaries[0].package.link
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0].binaries) && data[0].binaries.length > 0) {
      const binary = data[0].binaries.find((b: any) => b.image_type === imageType && b.architecture === arch);
      if (binary?.package?.link) {
        const downloadUrl = binary.package.link as string;
        logger.info(`Found download URL from fallback endpoint: ${downloadUrl}`);
        return downloadUrl;
      }
    }

    logger.error('No download URL found in API responses');
  } catch (error) {
    logger.error('Error getting Adoptium download URL:', error);
    if (error instanceof Error) {
      logger.error('Error details:', error.message);
    }
  }

  return null;
}

async function downloadFile(url: string, destination: string): Promise<void> {
  const paths = getPaths();
  await fs.ensureDir(paths.temp);

  const downloadStream = got.stream(url);
  const fileStream = fs.createWriteStream(destination);

  return new Promise((resolve, reject) => {
    downloadStream.on('downloadProgress', (progress) => {
      const percent = Math.round(progress.percent * 100);
      process.stdout.write(`\rDownloading Java: ${percent}%`);
    });

    downloadStream.on('error', reject);
    fileStream.on('finish', () => {
      console.log('\nDownload complete!');
      resolve(undefined);
    });
    fileStream.on('error', reject);
    downloadStream.pipe(fileStream);
  });
}

async function extractJava(
  archivePath: string,
  destination: string,
  osType: 'windows' | 'mac' | 'linux'
): Promise<void> {
  logger.info('Extracting Java archive...');

  if (osType === 'windows') {
    const zip = new AdmZip(archivePath);
    zip.extractAllTo(destination, true);
  } else {
    await execa('tar', ['-xzf', archivePath, '-C', destination]);
  }

  logger.info('Java extraction complete');
}
