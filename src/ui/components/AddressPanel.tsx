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

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1}>
      <Text color={theme.accent} bold>Connection Info</Text>
      
      <Box marginTop={1} flexDirection="column">
        <Box>
          <Text>LAN address: </Text>
          <Text color={theme.success}>{lanAddress}</Text>
        </Box>

        {publicAddress && (
          <Box>
            <Text>Public address: </Text>
            <Text color={publicColor}>
              {publicAddress}
            </Text>
          </Box>
        )}

        <Box marginTop={1}>
          <Text>UPnP: </Text>
          <Text color={networkInfo.upnpSuccess ? theme.success : theme.error}>
            {networkInfo.upnpSuccess ? 'Mapped' : 'Failed'}
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text>Reachability: </Text>
          <Text color={publicColor}>
            {networkInfo.reachable ? 'Publicly accessible' : 'LAN only'}
          </Text>
        </Box>

        {!networkInfo.reachable && (
          <Box marginTop={1} flexDirection="column">
            <Text color={theme.warning} bold>Tips:</Text>
            <Text color={theme.muted}>
              • Enable UPnP, or forward TCP {networkInfo.port} to this machine.
            </Text>
            <Text color={theme.muted}>
              • Alternative: share over Tailscale / VPN.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
