/**
 * Server provisioning (download + configuration)
 */

import fs from 'fs-extra';
import path from 'path';
import got from 'got';
import yaml from 'yaml';
import { execa } from 'execa';
import Handlebars from 'handlebars';
import { getPaths } from '../utils/paths.js';
import { logger } from '../utils/log.js';
import { downloadFile, calculateChecksum } from './downloads.js';
import { prepareWorld } from './world.js';
import type { LazyConfig, ServerType } from '../types/index.js';

interface ServerMetadata {
  type: ServerType;
  minecraftVersion: string;
  forgeVersion?: string;
  sha1?: string;
  source: string;
  updatedAt: string;
}

const VERSION_MANIFEST_URL = 'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json';
const FORGE_PROMOTIONS_URL = 'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json';

/**
 * Ensure the appropriate server jar and configuration exist
 */
export async function setupServer(config: LazyConfig): Promise<void> {
  const paths = getPaths();
  const serverJarPath = path.join(paths.root, 'server.jar');
  const metadataPath = path.join(paths.root, '.server-metadata.json');

  await prepareWorld(path.resolve(paths.root, config.worldPath), config.isNewWorld);

  const metadata = await loadMetadata(metadataPath);
  const needsDownload = await needsServerUpdate(metadata, config, serverJarPath);

  let nextMetadata: ServerMetadata | null = null;

  if (needsDownload) {
    logger.info(`Provisioning server files for ${config.serverType} ${config.minecraftVersion}`);

    if (config.serverType === 'vanilla') {
      nextMetadata = await provisionVanillaServer(config.minecraftVersion, serverJarPath);
    } else {
      nextMetadata = await provisionForgeServer(config, serverJarPath);
    }

    await saveMetadata(metadataPath, nextMetadata);
  } else {
    logger.info('Reusing existing server jar');
    nextMetadata = metadata;
  }

  if (nextMetadata) {
    config.serverJarType = nextMetadata.type;
    config.serverJarVersion = nextMetadata.type === 'forge'
      ? `${nextMetadata.minecraftVersion}-${nextMetadata.forgeVersion}`
      : nextMetadata.minecraftVersion;
  }

  await generateServerProperties(config);
}

async function needsServerUpdate(
  metadata: ServerMetadata | null,
  config: LazyConfig,
  serverJarPath: string
): Promise<boolean> {
  if (!await fs.pathExists(serverJarPath)) {
    return true;
  }

  if (!metadata) {
    return true;
  }

  if (metadata.type !== config.serverType) {
    return true;
  }

  if (metadata.minecraftVersion !== config.minecraftVersion) {
    return true;
  }

  return false;
}

/**
 * Download Vanilla server jar
 */
async function provisionVanillaServer(
  desiredVersion: string,
  destination: string
): Promise<ServerMetadata> {
  const manifest = await fetchJSON<VersionManifest>(VERSION_MANIFEST_URL);

  const targetVersion = desiredVersion === 'latest'
    ? manifest.latest.release
    : desiredVersion;

  const versionEntry = manifest.versions.find(v => v.id === targetVersion);
  if (!versionEntry) {
    throw new Error(`Minecraft version ${targetVersion} not found in manifest`);
  }

  const versionData = await fetchJSON<VersionDetail>(versionEntry.url);

  const serverDownload = versionData.downloads.server;
  if (!serverDownload) {
    throw new Error(`Server download missing for version ${targetVersion}`);
  }

  await downloadFile(serverDownload.url, destination, {
    checksum: serverDownload.sha1,
    checksumType: 'sha1',
    onProgress: percent => {
      const pct = Math.round(percent * 100);
      process.stdout.write(`\rDownloading Minecraft server ${targetVersion}: ${pct}%`);
    },
  });
  process.stdout.write('\n');

  const sha1 = await calculateChecksum(destination, 'sha1');

  return {
    type: 'vanilla',
    minecraftVersion: targetVersion,
    sha1,
    source: serverDownload.url,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Download Forge server (installer-based if needed)
 */
async function provisionForgeServer(
  config: LazyConfig,
  destination: string
): Promise<ServerMetadata> {
  const promotionData = await fetchJSON<ForgePromotions>(FORGE_PROMOTIONS_URL);
  const targetMinecraftVersion = config.minecraftVersion === 'latest'
    ? resolveLatestForgeMinecraftVersion(promotionData.promos)
    : config.minecraftVersion;

  if (!targetMinecraftVersion) {
    throw new Error('Unable to determine latest Minecraft version supported by Forge');
  }

  const forgeBuild = resolveForgeBuild(targetMinecraftVersion, promotionData.promos);
  if (!forgeBuild) {
    throw new Error(`No Forge build found for Minecraft ${targetMinecraftVersion}`);
  }

  const combinedVersion = `${forgeBuild.mcVersion}-${forgeBuild.forgeVersion}`;
  const baseUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${combinedVersion}`;
  const serverJarUrl = `${baseUrl}/forge-${combinedVersion}-server.jar`;
  const installerUrl = `${baseUrl}/forge-${combinedVersion}-installer.jar`;

  const paths = getPaths();

  try {
    await downloadFile(serverJarUrl, destination, {
      onProgress: percent => {
        const pct = Math.round(percent * 100);
        process.stdout.write(`\rDownloading Forge server ${combinedVersion}: ${pct}%`);
      },
    });
    process.stdout.write('\n');
  } catch (error) {
    logger.warn('Direct Forge server download failed, falling back to installer', error);

    const installerPath = path.join(paths.temp, `forge-installer-${combinedVersion}.jar`);
    await downloadFile(installerUrl, installerPath);

    const javaExec = config.javaPath || 'java';
    await execa(javaExec, ['-jar', installerPath, '--installServer'], {
      cwd: paths.root,
      stdout: 'inherit',
      stderr: 'inherit',
    });

    await fs.remove(installerPath);

    const producedJar = await findForgeServerJar(paths.root, combinedVersion);
    if (!producedJar) {
      throw new Error('Forge installer did not produce a server jar');
    }

    await fs.move(producedJar, destination, { overwrite: true });
  }

  const sha1 = await calculateChecksum(destination, 'sha1');

  return {
    type: 'forge',
    minecraftVersion: forgeBuild.mcVersion,
    forgeVersion: forgeBuild.forgeVersion,
    sha1,
    source: serverJarUrl,
    updatedAt: new Date().toISOString(),
  };
}

async function findForgeServerJar(directory: string, versionFragment: string): Promise<string | null> {
  const files = await fs.readdir(directory);
  const candidate = files.find(file =>
    file.startsWith(`forge-${versionFragment}`) &&
    file.endsWith('-server.jar')
  );

  if (!candidate) {
    return null;
  }

  return path.join(directory, candidate);
}

/**
 * Generate server.properties file based on profile + config
 */
async function generateServerProperties(config: LazyConfig): Promise<void> {
  const paths = getPaths();
  const propertiesPath = path.join(paths.root, 'server.properties');
  const profileProps = await loadProfileProperties(config.profile);

  const levelName = path.basename(config.worldPath);

  const properties: Record<string, string | number | boolean> = {
    'enable-jmx-monitoring': false,
    'rcon.port': 25575,
    'level-seed': profileProps['level-seed'] ?? '',
    'gamemode': profileProps['gamemode'] ?? 'survival',
    'enable-command-block': profileProps['enable-command-block'] ?? false,
    'enable-query': false,
    'generator-settings': '',
    'level-name': levelName,
    'motd': profileProps['motd'] ?? `LazyCraft Server - ${config.minecraftVersion}`,
    'query.port': config.port,
    'pvp': profileProps['pvp'] ?? true,
    'difficulty': profileProps['difficulty'] ?? 'normal',
    'network-compression-threshold': 256,
    'max-tick-time': 60000,
    'max-players': profileProps['max-players'] ?? 20,
    'use-native-transport': true,
    'enable-status': true,
    'online-mode': profileProps['online-mode'] ?? true,
    'allow-flight': profileProps['allow-flight'] ?? (config.serverType === 'forge'),
    'broadcast-rcon-to-ops': true,
    'view-distance': profileProps['view-distance'] ?? 10,
    'max-build-height': 256,
    'server-ip': '',
    'allow-nether': profileProps['allow-nether'] ?? true,
    'server-port': config.port,
    'enable-rcon': false,
    'sync-chunk-writes': true,
    'op-permission-level': profileProps['op-permission-level'] ?? 4,
    'prevent-proxy-connections': false,
    'resource-pack': '',
    'entity-broadcast-range-percentage': 100,
    'simulation-distance': profileProps['simulation-distance'] ?? 10,
    'level-type': profileProps['level-type'] ?? 'default',
    'spawn-protection': profileProps['spawn-protection'] ?? 16,
    'max-world-size': profileProps['max-world-size'] ?? 29999984,
    'broadcast-console-to-ops': true,
    'spawn-npcs': profileProps['spawn-npcs'] ?? true,
    'spawn-animals': profileProps['spawn-animals'] ?? true,
    'spawn-monsters': profileProps['spawn-monsters'] ?? true,
    'white-list': profileProps['white-list'] ?? false,
    'force-gamemode': profileProps['force-gamemode'] ?? false,
    'hardcore': profileProps['hardcore'] ?? false,
  };

  const entries = Object.entries(properties).map(([key, value]) => ({
    key,
    value: formatPropertyValue(value),
  }));

  const templatePath = path.join(paths.root, 'templates', 'server.properties.hbs');
  let rendered: string;

  if (await fs.pathExists(templatePath)) {
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);
    rendered = template({
      generatedAt: new Date().toISOString(),
      entries,
    });
  } else {
    const lines = [
      '# Generated by LazyCraftLauncher',
      `# ${new Date().toISOString()}`,
      ...entries.map(entry => `${entry.key}=${entry.value}`),
    ];
    rendered = lines.join('\n');
  }

  if (!rendered.endsWith('\n')) {
    rendered += '\n';
  }

  await fs.writeFile(propertiesPath, rendered, 'utf-8');
  logger.info('server.properties refreshed');
}

async function loadProfileProperties(profileId: string): Promise<Record<string, any>> {
  const paths = getPaths();
  const profilePath = path.join(paths.root, 'templates', 'profiles', `${profileId}.yml`);
  const fallbackPath = path.join(paths.root, 'templates', 'profiles', 'survival-default.yml');

  const targetPath = await fs.pathExists(profilePath) ? profilePath : fallbackPath;

  if (!await fs.pathExists(targetPath)) {
    return {};
  }

  const content = await fs.readFile(targetPath, 'utf-8');
  const parsed = yaml.parse(content) as any;

  if (parsed && typeof parsed === 'object' && parsed.server) {
    return parsed.server as Record<string, any>;
  }

  return parsed || {};
}

async function loadMetadata(filePath: string): Promise<ServerMetadata | null> {
  try {
    if (!await fs.pathExists(filePath)) {
      return null;
    }
    return await fs.readJson(filePath) as ServerMetadata;
  } catch (error) {
    logger.warn('Failed to read server metadata:', error);
    return null;
  }
}

async function saveMetadata(filePath: string, metadata: ServerMetadata): Promise<void> {
  await fs.writeJson(filePath, metadata, { spaces: 2 });
}

function formatPropertyValue(value: string | number | boolean): string {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
}

function resolveForgeBuild(mcVersion: string, promos: Record<string, string>): ForgeBuild | null {
  const recommended = promos[`${mcVersion}-recommended`];
  const latest = promos[`${mcVersion}-latest`];

  if (recommended) {
    return { mcVersion, forgeVersion: recommended };
  }

  if (latest) {
    return { mcVersion, forgeVersion: latest };
  }

  return null;
}

function resolveLatestForgeMinecraftVersion(promos: Record<string, string>): string | null {
  const versions = Array.from(
    new Set(
      Object.keys(promos)
        .map(key => key.split('-')[0])
        .filter(Boolean)
    )
  );

  if (versions.length === 0) {
    return null;
  }

  versions.sort(compareSemanticVersions);
  return versions[versions.length - 1];
}

function compareSemanticVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  const length = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < length; i++) {
    const valueA = partsA[i] || 0;
    const valueB = partsB[i] || 0;
    if (valueA > valueB) return 1;
    if (valueA < valueB) return -1;
  }
  return 0;
}

async function fetchJSON<T>(url: string): Promise<T> {
  return await got(url, { timeout: { request: 15000 } }).json<T>();
}

interface VersionManifest {
  latest: {
    release: string;
    snapshot: string;
  };
  versions: Array<{
    id: string;
    url: string;
    sha1?: string;
  }>;
}

interface VersionDetail {
  downloads: {
    server: {
      sha1: string;
      size: number;
      url: string;
    };
  };
}

interface ForgePromotions {
  promos: Record<string, string>;
}

interface ForgeBuild {
  mcVersion: string;
  forgeVersion: string;
}
