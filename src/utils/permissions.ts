/**
 * Permissions Detection Utilities
 *
 * This module provides cross-platform utilities for detecting whether the current
 * process is running with elevated (administrator/root) privileges.
 *
 * **Platform Support:**
 * - Windows: Checks if process has Administrator privileges
 * - macOS/Linux: Checks if process is running as root (UID 0) or via sudo
 *
 * **Use Cases:**
 * - Determining if firewall rules can be automatically configured
 * - Deciding whether to attempt privileged operations or provide manual instructions
 * - Warning users when operations require elevation
 *
 * @module utils/permissions
 */

import { execa } from 'execa';
import { logger } from './log.js';

/**
 * Cache for elevation status to avoid repeated checks.
 * Set to null initially, then cached as true/false after first check.
 */
let cachedElevation: boolean | null = null;

/**
 * Determine whether the current process has administrative/root privileges.
 *
 * This function detects elevated privileges across different platforms:
 *
 * **Windows:**
 * - Runs `net session` command, which only succeeds with Administrator rights
 * - Exit code 0 = Administrator, non-zero = Regular user
 *
 * **macOS/Linux:**
 * - Checks if UID is 0 (root user)
 * - Checks if SUDO_UID environment variable is set (running via sudo)
 *
 * **Caching:**
 * - Result is cached after first call for performance
 * - Elevation status doesn't change during process lifetime
 *
 * @returns Promise<boolean> - True if process has elevated privileges, false otherwise
 *
 * @example
 * ```typescript
 * const elevated = await isElevated();
 * if (!elevated) {
 *   console.log('Please run with administrator/sudo privileges');
 *   console.log('Or follow the manual configuration steps below:');
 *   // Show manual steps...
 * }
 * ```
 */
export async function isElevated(): Promise<boolean> {
  // Return cached result if available
  if (cachedElevation !== null) {
    logger.debug(`Returning cached elevation status: ${cachedElevation}`);
    return cachedElevation;
  }

  // Determine platform and check elevation
  if (process.platform === 'win32') {
    logger.debug('Checking Windows elevation status');
    cachedElevation = await isWindowsElevated();
  } else {
    logger.debug('Checking Unix elevation status');
    cachedElevation = isUnixElevated();
  }

  logger.info(`Process elevation status: ${cachedElevation ? 'elevated' : 'not elevated'}`);
  return cachedElevation;
}

/**
 * Check if the current Windows process has Administrator privileges.
 *
 * Uses the `net session` command as a reliable method to detect Administrator rights.
 * This command requires Administrator privileges to succeed.
 *
 * **Why `net session`?**
 * - Fast and reliable
 * - Available on all Windows versions (XP+)
 * - Exit code 0 only when Administrator
 * - No external dependencies
 *
 * **Alternative methods (not used):**
 * - Windows Registry checks (slower, less reliable)
 * - WMI queries (requires additional setup)
 * - Token elevation checks (requires native modules)
 *
 * @returns Promise<boolean> - True if Administrator, false otherwise
 *
 * @internal
 */
async function isWindowsElevated(): Promise<boolean> {
  try {
    // Run 'net session' which only succeeds with admin rights
    const result = await execa('net', ['session'], {
      reject: false,        // Don't throw on non-zero exit
      stdout: 'ignore',     // Suppress output
      stderr: 'ignore',     // Suppress errors
      timeout: 5000,        // 5-second timeout
    });

    // Exit code 0 means Administrator
    const isAdmin = result.exitCode === 0;
    logger.debug(`Windows 'net session' exit code: ${result.exitCode} (${isAdmin ? 'Admin' : 'Not Admin'})`);
    return isAdmin;
  } catch (error) {
    // If command fails to run entirely, assume not elevated
    logger.warn('Failed to check Windows elevation:', error);
    return false;
  }
}

/**
 * Check if the current Unix process is running as root or via sudo.
 *
 * Uses two methods to detect elevated privileges:
 *
 * **Method 1: UID Check (Primary)**
 * - Uses `process.getuid()` to get user ID
 * - UID 0 = root user
 * - Most reliable method on Unix systems
 *
 * **Method 2: SUDO_UID Environment Variable (Fallback)**
 * - Set by sudo when elevating privileges
 * - Useful when getuid() is unavailable (rare)
 *
 * **Why check both?**
 * - `process.getuid()` may not exist in some environments (e.g., Windows)
 * - SUDO_UID provides additional confirmation
 *
 * @returns boolean - True if root/sudo, false otherwise
 *
 * @internal
 */
function isUnixElevated(): boolean {
  // Method 1: Check if UID is 0 (root)
  if (typeof process.getuid === 'function') {
    const uid = process.getuid();
    logger.debug(`Current UID: ${uid}`);

    if (uid === 0) {
      logger.debug('Running as root (UID 0)');
      return true;
    }
  } else {
    logger.debug('process.getuid() not available');
  }

  // Method 2: Check for SUDO_UID environment variable
  if (process.env.SUDO_UID) {
    logger.debug(`SUDO_UID detected: ${process.env.SUDO_UID}`);
    return true;
  }

  logger.debug('Not running as root or via sudo');
  return false;
}

/**
 * Clear the cached elevation status.
 *
 * Useful for testing or if elevation status changes during runtime
 * (though this is rare in normal operation).
 *
 * @example
 * ```typescript
 * clearElevationCache();
 * const newStatus = await isElevated(); // Will recheck
 * ```
 */
export function clearElevationCache(): void {
  logger.debug('Clearing elevation cache');
  cachedElevation = null;
}

/**
 * Get platform-specific instructions for running with elevated privileges.
 *
 * Provides user-friendly guidance on how to run the application with
 * the necessary permissions for firewall configuration.
 *
 * @returns Array of instruction strings for the current platform
 *
 * @example
 * ```typescript
 * const instructions = getElevationInstructions();
 * console.log('To enable automatic firewall configuration:');
 * instructions.forEach(line => console.log(line));
 * ```
 */
export function getElevationInstructions(): string[] {
  const platform = process.platform;

  if (platform === 'win32') {
    return [
      '',
      '╔═══════════════════════════════════════════════════════════╗',
      '║     ADMINISTRATOR PRIVILEGES REQUIRED                     ║',
      '╚═══════════════════════════════════════════════════════════╝',
      '',
      'To enable automatic firewall configuration on Windows:',
      '',
      '1. Close this program',
      '2. Right-click the program executable or shortcut',
      '3. Select "Run as administrator"',
      '4. Click "Yes" on the User Account Control (UAC) prompt',
      '5. Relaunch the program',
      '',
      'Alternatively, follow the manual firewall configuration steps.',
      '',
    ];
  } else if (platform === 'darwin') {
    return [
      '',
      '╔═══════════════════════════════════════════════════════════╗',
      '║     SUDO PRIVILEGES REQUIRED                              ║',
      '╚═══════════════════════════════════════════════════════════╝',
      '',
      'To enable automatic firewall configuration on macOS:',
      '',
      '1. Open Terminal',
      '2. Run the program with sudo:',
      '   sudo node dist/main.js',
      '   (or your specific command)',
      '3. Enter your password when prompted',
      '',
      'Alternatively, follow the manual firewall configuration steps.',
      '',
    ];
  } else {
    return [
      '',
      '╔═══════════════════════════════════════════════════════════╗',
      '║     SUDO PRIVILEGES REQUIRED                              ║',
      '╚═══════════════════════════════════════════════════════════╝',
      '',
      'To enable automatic firewall configuration on Linux:',
      '',
      '1. Open Terminal',
      '2. Run the program with sudo:',
      '   sudo node dist/main.js',
      '   (or your specific command)',
      '3. Enter your password when prompted',
      '',
      'Alternatively, follow the manual firewall configuration steps.',
      '',
    ];
  }
}
