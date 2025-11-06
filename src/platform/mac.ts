/**
 * macOS specific helper functions
 */

export function getMacFirewallCommands(): string[][] {
  return [
    [
      '/usr/libexec/ApplicationFirewall/socketfilterfw',
      '--add',
      '/usr/bin/java',
    ],
    [
      '/usr/libexec/ApplicationFirewall/socketfilterfw',
      '--unblock',
      '/usr/bin/java',
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
