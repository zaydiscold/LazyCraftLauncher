/**
 * Helper utilities to detect elevated privileges
 */

import { execa } from 'execa';

let cachedElevation: boolean | null = null;

/**
 * Determine whether the current process has administrative/root privileges.
 */
export async function isElevated(): Promise<boolean> {
  if (cachedElevation !== null) {
    return cachedElevation;
  }

  if (process.platform === 'win32') {
    cachedElevation = await isWindowsElevated();
  } else {
    cachedElevation = isUnixElevated();
  }

  return cachedElevation;
}

async function isWindowsElevated(): Promise<boolean> {
  try {
    const result = await execa('net', ['session'], {
      reject: false,
      stdout: 'ignore',
      stderr: 'ignore',
    });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

function isUnixElevated(): boolean {
  if (typeof process.getuid === 'function') {
    return process.getuid() === 0;
  }

  if (process.env.SUDO_UID) {
    return true;
  }

  return false;
}
