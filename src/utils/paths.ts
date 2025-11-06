/**
 * Path Management Utility
 */

import path from 'path';
import os from 'os';

export interface AppPaths {
  root: string;
  logs: string;
  backups: string;
  temp: string;
  jre: string;
  cache: string;
}

/**
 * Resolve core application paths (root = current working directory)
 */
export function getPaths(): AppPaths {
  const root = process.cwd();

  return {
    root,
    logs: path.join(root, 'logs'),
    backups: path.join(root, 'backups'),
    temp: path.join(root, '.temp'),
    jre: path.join(root, 'jre'),
    cache: path.join(root, '.cache'),
  };
}

export function getPlatformPaths(): {
  userData: string;
  temp: string;
  home: string;
} {
  return {
    userData: getAppDataPath(),
    temp: os.tmpdir(),
    home: os.homedir(),
  };
}

function getAppDataPath(): string {
  const platform = process.platform;
  const home = os.homedir();

  switch (platform) {
    case 'win32':
      return process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    case 'darwin':
      return path.join(home, 'Library', 'Application Support');
    default:
      return process.env.XDG_CONFIG_HOME || path.join(home, '.config');
  }
}

export function resolvePath(...parts: string[]): string {
  const paths = getPaths();
  return path.resolve(paths.root, ...parts);
}

export function isAbsolutePath(p: string): boolean {
  return path.isAbsolute(p);
}

export function normalizePath(p: string): string {
  return path.normalize(p);
}
