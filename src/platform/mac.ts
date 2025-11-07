/**
 * macOS specific helper functions
 */

export function getMacFirewallCommands(javaPath = '/usr/bin/java'): string[][] {
  return [
    [
      '/usr/libexec/ApplicationFirewall/socketfilterfw',
      '--add',
      javaPath,
    ],
    [
      '/usr/libexec/ApplicationFirewall/socketfilterfw',
      '--unblock',
      javaPath,
    ],
  ];
}

export function getMacFirewallManualSteps(): string[] {
  return [
    '1. Open System Settings → Network → Firewall.',
    '2. Click "Options…" and unlock with your password.',
    '3. Add Java (located at /usr/bin/java) to the allowed applications.',
    '4. Set Java to "Allow incoming connections".',
  ];
}

export function getMacFirewallRemoveCommand(): string[] {
  return [
    '/usr/libexec/ApplicationFirewall/socketfilterfw',
    '--remove',
    '/usr/bin/java',
  ];
}
