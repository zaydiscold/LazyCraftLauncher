/**
 * Windows Platform-Specific Helper Functions
 *
 * This module provides Windows-specific utilities for firewall configuration.
 * All firewall operations require Administrator privileges on Windows.
 *
 * @module platform/windows
 */

/**
 * Rule name used consistently across all firewall operations.
 * This ensures we can reliably remove/update the rule later.
 */
const FIREWALL_RULE_NAME = 'LazyCraftLauncher';

/**
 * Generate command arguments for adding a Windows Firewall rule.
 *
 * Uses the Windows `netsh advfirewall` command to create an inbound rule
 * that allows TCP traffic on the specified port.
 *
 * **Requirements:**
 * - Must be run with Administrator privileges
 * - Available on Windows Vista and later
 *
 * **Command Structure:**
 * ```
 * netsh advfirewall firewall add rule
 *   name="LazyCraftLauncher"
 *   dir=in
 *   action=allow
 *   protocol=TCP
 *   localport=<port>
 * ```
 *
 * @param port - The TCP port to allow (typically 25565 for Minecraft)
 * @returns Array of command arguments for netsh
 *
 * @example
 * ```typescript
 * const args = getWindowsFirewallAddArgs(25565);
 * await execa('netsh', args);
 * ```
 */
export function getWindowsFirewallAddArgs(port: number): string[] {
  // Validate port number to prevent command injection
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port number: ${port}. Must be between 1-65535.`);
  }

  return [
    'advfirewall',
    'firewall',
    'add',
    'rule',
    `name=${FIREWALL_RULE_NAME}`,
    'dir=in',              // Inbound traffic
    'action=allow',        // Allow connections
    'protocol=TCP',        // TCP protocol (Minecraft uses TCP)
    `localport=${port}`,   // Specific port to open
  ];
}

/**
 * Generate command arguments for removing the Windows Firewall rule.
 *
 * This removes any existing rule with the name "LazyCraftLauncher".
 * It's safe to call even if the rule doesn't exist (netsh will simply report no rules found).
 *
 * **Requirements:**
 * - Must be run with Administrator privileges
 *
 * **Command Structure:**
 * ```
 * netsh advfirewall firewall delete rule name="LazyCraftLauncher"
 * ```
 *
 * @returns Array of command arguments for netsh
 *
 * @example
 * ```typescript
 * const args = getWindowsFirewallRemoveArgs();
 * await execa('netsh', args, { reject: false });
 * ```
 */
export function getWindowsFirewallRemoveArgs(): string[] {
  return [
    'advfirewall',
    'firewall',
    'delete',
    'rule',
    `name=${FIREWALL_RULE_NAME}`,
  ];
}

/**
 * Get human-readable manual steps for configuring Windows Firewall.
 *
 * Provides step-by-step instructions for users who cannot or prefer not to
 * run the launcher with Administrator privileges.
 *
 * These instructions work on:
 * - Windows 10
 * - Windows 11
 * - Windows Server 2016+
 *
 * @param port - The TCP port to configure (typically 25565 for Minecraft)
 * @returns Array of instruction strings, one per step
 *
 * @example
 * ```typescript
 * const steps = getWindowsFirewallManualSteps(25565);
 * steps.forEach(step => console.log(step));
 * ```
 */
export function getWindowsFirewallManualSteps(port: number): string[] {
  return [
    '╔═══════════════════════════════════════════════════════════╗',
    '║     MANUAL WINDOWS FIREWALL CONFIGURATION                 ║',
    '╚═══════════════════════════════════════════════════════════╝',
    '',
    '1. Press Win+R and type: wf.msc',
    '   (This opens Windows Defender Firewall with Advanced Security)',
    '',
    '2. In the left panel, click "Inbound Rules"',
    '',
    '3. In the right panel, click "New Rule..."',
    '',
    '4. Rule Type: Select "Port" → Click Next',
    '',
    '5. Protocol and Ports:',
    '   • Select "TCP"',
    `   • Select "Specific local ports" and enter: ${port}`,
    '   • Click Next',
    '',
    '6. Action: Select "Allow the connection" → Click Next',
    '',
    '7. Profile: Keep all three checked (Domain, Private, Public) → Click Next',
    '',
    `8. Name: Enter "${FIREWALL_RULE_NAME}" → Click Finish`,
    '',
    '✓ Done! Your server port is now open.',
    '',
  ];
}

/**
 * Check if a firewall rule with our name already exists.
 *
 * This is useful to avoid creating duplicate rules.
 *
 * @returns Promise<boolean> - True if rule exists, false otherwise
 *
 * @example
 * ```typescript
 * const exists = await isFirewallRuleExists();
 * if (exists) {
 *   console.log('Rule already configured');
 * }
 * ```
 */
export async function isFirewallRuleExists(): Promise<boolean> {
  try {
    const { execa } = await import('execa');
    const result = await execa('netsh', [
      'advfirewall',
      'firewall',
      'show',
      'rule',
      `name=${FIREWALL_RULE_NAME}`,
    ], { reject: false });

    // If rule exists, output will contain the rule name
    return result.stdout.includes(FIREWALL_RULE_NAME);
  } catch {
    return false;
  }
}

/**
 * Get the standardized firewall rule name.
 *
 * @returns The firewall rule name used across all operations
 */
export function getFirewallRuleName(): string {
  return FIREWALL_RULE_NAME;
}
