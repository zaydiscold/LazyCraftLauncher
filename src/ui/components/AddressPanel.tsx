/**
 * Address Panel Component
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { NetworkInfo } from '../../types/index.js';
import { theme } from '../theme.js';

interface AddressPanelProps {
  networkInfo: NetworkInfo;
}

export const AddressPanel: React.FC<AddressPanelProps> = ({ networkInfo }) => {
  const lanAddress = `${networkInfo.lanIP}:${networkInfo.port}`;
  const publicAddress = networkInfo.publicIP
    ? `${networkInfo.publicIP}:${networkInfo.port}`
    : null;
  const publicColor = networkInfo.reachable ? theme.success : theme.warning;

  // Determine which address to show prominently
  const shareAddress = networkInfo.reachable && publicAddress ? publicAddress : lanAddress;
  const shareType = networkInfo.reachable && publicAddress ? 'INTERNET' : 'LAN ONLY';
  const shareColor = networkInfo.reachable && publicAddress ? theme.success : theme.warning;

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1}>
      <Text color={theme.accent} bold>Connection Info</Text>

      <Box marginTop={1} flexDirection="column">
        {/* Big prominent address box */}
        <Box flexDirection="column" borderStyle="round" borderColor={shareColor} paddingX={1} marginBottom={1}>
          <Text color={theme.muted} dimColor>SHARE THIS ADDRESS ({shareType}):</Text>
          <Text color={shareColor} bold> {shareAddress} </Text>
        </Box>

        {/* Detailed breakdown */}
        <Box flexDirection="column" marginTop={1}>
          <Text color={theme.muted} dimColor>Details:</Text>

          <Box marginTop={1}>
            <Text dimColor>• LAN: </Text>
            <Text color={theme.success}>{lanAddress}</Text>
          </Box>

          {publicAddress && (
            <Box>
              <Text dimColor>• Internet: </Text>
              <Text color={publicColor}>{publicAddress}</Text>
            </Box>
          )}

          <Box>
            <Text dimColor>• Port: </Text>
            <Text color={theme.accent}>{networkInfo.port}</Text>
          </Box>

          <Box>
            <Text dimColor>• UPnP: </Text>
            <Text color={networkInfo.upnpSuccess ? theme.success : theme.error}>
              {networkInfo.upnpSuccess ? 'Enabled' : 'Disabled'}
            </Text>
          </Box>

          <Box>
            <Text dimColor>• Access: </Text>
            <Text color={publicColor}>
              {networkInfo.reachable ? 'Public ✓' : 'Local only'}
            </Text>
          </Box>
        </Box>

        {!networkInfo.reachable && (
          <Box marginTop={1} flexDirection="column">
            <Text color={theme.warning} bold>🌐 Need Internet Access?</Text>
            <Text color={theme.muted} dimColor> </Text>
            <Text color={theme.muted}>To allow friends outside your network to connect:</Text>
            <Text color={theme.muted}> </Text>
            <Text color={theme.accent}>1. Manual Port Forwarding:</Text>
            <Text color={theme.muted}>   • Log into your router (usually 192.168.1.1)</Text>
            <Text color={theme.muted}>   • Find "Port Forwarding" settings</Text>
            <Text color={theme.muted}>   • Forward port {networkInfo.port} (TCP) to {networkInfo.lanIP}</Text>
            <Text color={theme.muted}> </Text>
            <Text color={theme.accent}>2. Enable UPnP on Router:</Text>
            <Text color={theme.muted}>   • Log into router settings</Text>
            <Text color={theme.muted}>   • Enable UPnP/NAT-PMP</Text>
            <Text color={theme.muted}>   • Restart launcher</Text>
            <Text color={theme.muted}> </Text>
            <Text color={theme.accent}>3. Use VPN (Easiest):</Text>
            <Text color={theme.muted}>   • Install Tailscale/ZeroTier/Hamachi</Text>
            <Text color={theme.muted}>   • All players join same network</Text>
            <Text color={theme.muted}>   • Use LAN address: {networkInfo.lanIP}:{networkInfo.port}</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
