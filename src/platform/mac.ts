/**
 * macOS Platform-Specific Helper Functions
 *
 * This module provides macOS-specific utilities for firewall configuration.
 * macOS uses the Application Firewall (socketfilterfw) which works by allowing
 * specific applications rather than ports.
 *
 * **Important Notes:**
 * - Requires sudo/administrator privileges
 * - System Integrity Protection (SIP) may block some operations
 * - macOS firewall must be enabled for these commands to matter
 * - Works on macOS 10.6+ (Snow Leopard and later)
 *
 * @module platform/mac
 */

/**
 * The path to macOS Application Firewall command-line tool.
 * This is the standard system location for socketfilterfw.
 */
const SOCKETFILTERFW_PATH = '/usr/libexec/ApplicationFirewall/socketfilterfw';

/**
 * Generate commands for adding Java to the macOS Application Firewall.
 *
 * Returns an array of command arrays that need to be executed sequentially:
 * 1. `--add`: Adds the Java binary to the firewall's application list
 * 2. `--unblock`: Explicitly allows incoming connections for Java
 *
 * **Why two commands?**
 * - `--add` registers the application with the firewall
 * - `--unblock` ensures it's set to "Allow incoming connections" (not just "Block")
 *
 * **Requirements:**
 * - Must be run with sudo
 * - macOS firewall must be enabled (check with --getglobalstate)
 * - Java binary must exist at the specified path
 *
 * @param javaPath - Full path to the Java binary (e.g., '/usr/bin/java' or './jre/bin/java')
 * @returns Array of command arrays, each representing a sudo command to execute
 *
 * @example
 * ```typescript
 * const commands = getMacFirewallCommands('./jre/bin/java');
 * for (const args of commands) {
 *   await execa('sudo', args, { stdio: 'inherit' });
 * }
 * ```
 */
export function getMacFirewallCommands(javaPath: string): string[][] {
  // Validate that javaPath is provided and non-empty
  if (!javaPath || typeof javaPath !== 'string') {
    throw new Error('Java path is required for macOS firewall configuration');
  }

  return [
    // Command 1: Add Java to the firewall's known applications
    [
      SOCKETFILTERFW_PATH,
      '--add',
      javaPath,
    ],
    // Command 2: Set Java to allow incoming connections
    [
      SOCKETFILTERFW_PATH,
      '--unblock',
      javaPath,
    ],
  ];
}

/**
 * Get human-readable manual steps for configuring macOS Firewall.
 *
 * Provides step-by-step GUI instructions for users who:
 * - Don't have sudo access
 * - Prefer manual configuration
 * - Encounter System Integrity Protection (SIP) blocks
 *
 * These instructions work on:
 * - macOS Monterey (12.x)
 * - macOS Ventura (13.x)
 * - macOS Sonoma (14.x)
 * - macOS Sequoia (15.x)
 *
 * @param javaPath - Path to Java binary to display in instructions (optional)
 * @returns Array of instruction strings, one per step
 *
 * @example
 * ```typescript
 * const steps = getMacFirewallManualSteps('./jre/bin/java');
 * steps.forEach(step => console.log(step));
 * ```
 */
export function getMacFirewallManualSteps(javaPath?: string): string[] {
  const displayPath = javaPath || '/usr/bin/java';

  return [
    '╔═══════════════════════════════════════════════════════════╗',
    '║     MANUAL macOS FIREWALL CONFIGURATION                   ║',
    '╚═══════════════════════════════════════════════════════════╝',
    '',
    '1. Open System Settings (or System Preferences on older macOS)',
    '',
    '2. Navigate to:',
    '   • macOS 13+: Network → Firewall',
    '   • macOS 12 and below: Security & Privacy → Firewall',
    '',
    '3. Click the lock icon 🔒 and enter your password to unlock',
    '',
    '4. Click "Firewall Options..." or "Options"',
    '',
    '5. Click the "+" button to add an application',
    '',
    '6. Press Cmd+Shift+G and paste this path:',
    `   ${displayPath}`,
    '',
    '7. Select the Java binary and click "Add"',
    '',
    '8. Ensure the dropdown next to Java shows:',
    '   "Allow incoming connections"',
    '',
    '9. Click "OK" to save changes',
    '',
    '✓ Done! Java can now accept incoming connections.',
    '',
    'Note: If your firewall is disabled, you don\'t need to do this.',
    '',
  ];
}

/**
 * Generate command for removing Java from the macOS Firewall.
 *
 * This is useful for cleanup or when switching Java versions.
 * Safe to call even if Java isn't in the firewall list.
 *
 * **Requirements:**
 * - Must be run with sudo
 *
 * @param javaPath - Path to the Java binary to remove (defaults to system Java)
 * @returns Command arguments array for sudo
 *
 * @example
 * ```typescript
 * const args = getMacFirewallRemoveCommand('./jre/bin/java');
 * await execa('sudo', args, { reject: false });
 * ```
 */
export function getMacFirewallRemoveCommand(javaPath = '/usr/bin/java'): string[] {
  return [
    SOCKETFILTERFW_PATH,
    '--remove',
    javaPath,
  ];
}

/**
 * Check if macOS firewall is enabled.
 *
 * This helps determine if we need to configure the firewall at all.
 * If the firewall is disabled, no configuration is necessary.
 *
 * @returns Promise<boolean> - True if firewall is enabled, false otherwise
 *
 * @example
 * ```typescript
 * const enabled = await isFirewallEnabled();
 * if (!enabled) {
 *   console.log('Firewall is disabled, skipping configuration');
 * }
 * ```
 */
export async function isFirewallEnabled(): Promise<boolean> {
  try {
    const { execa } = await import('execa');
    const result = await execa('sudo', [
      SOCKETFILTERFW_PATH,
      '--getglobalstate',
    ], { reject: false, stdio: 'pipe' });

    // Output contains "enabled" if firewall is on, "disabled" if off
    return result.stdout.toLowerCase().includes('enabled');
  } catch {
    // If we can't determine, assume it's enabled to be safe
    return true;
  }
}

/**
 * Check if a specific application is already in the firewall list.
 *
 * Useful to avoid redundant configuration attempts.
 *
 * @param javaPath - Path to the Java binary to check
 * @returns Promise<boolean> - True if Java is in firewall list
 *
 * @example
 * ```typescript
 * const exists = await isApplicationInFirewall('./jre/bin/java');
 * if (exists) {
 *   console.log('Java already configured in firewall');
 * }
 * ```
 */
export async function isApplicationInFirewall(javaPath: string): Promise<boolean> {
  try {
    const { execa } = await import('execa');
    const result = await execa('sudo', [
      SOCKETFILTERFW_PATH,
      '--listapps',
    ], { reject: false, stdio: 'pipe' });

    // Check if the Java path appears in the list of applications
    return result.stdout.includes(javaPath);
  } catch {
    return false;
  }
}

/**
 * Get the socketfilterfw command path.
 *
 * @returns The full path to the macOS Application Firewall tool
 */
export function getSocketFilterFwPath(): string {
  return SOCKETFILTERFW_PATH;
}
