/**
 * Windows specific helper functions
 */

export function getWindowsFirewallAddArgs(port: number): string[] {
  return [
    'advfirewall', 'firewall', 'add', 'rule',
    'name=LazyCraftLauncher',
    'dir=in',
    'action=allow',
    'protocol=TCP',
    `localport=${port}`,
  ];
}

export function getWindowsFirewallRemoveArgs(): string[] {
  return [
    'advfirewall', 'firewall', 'delete', 'rule',
    'name=LazyCraftLauncher',
  ];
}

export function getWindowsFirewallManualSteps(port: number): string[] {
  return [
    '1. Open "Windows Security" → "Firewall & network protection".',
    '2. Select "Advanced settings".',
    '3. Choose "Inbound Rules" → "New Rule...".',
    '4. Rule Type: "Port".',
    '5. Select "TCP" and specify port ' + port + '.',
    '6. Allow the connection and apply to all profiles.',
    '7. Name the rule "LazyCraftLauncher" and finish.',
  ];
}
