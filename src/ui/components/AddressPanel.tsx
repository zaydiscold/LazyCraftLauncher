/**
 * Address Panel Component with QR Code
 */

import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { generateQRCode } from '../../core/qr.js';
import type { NetworkInfo } from '../../types/index.js';

interface AddressPanelProps {
  networkInfo: NetworkInfo;
}

export const AddressPanel: React.FC<AddressPanelProps> = ({ networkInfo }) => {
  const [qrCode, setQrCode] = useState<string>('');

  useEffect(() => {
    const address = networkInfo.publicIP 
      ? `${networkInfo.publicIP}:${networkInfo.port}`
      : `${networkInfo.lanIP}:${networkInfo.port}`;
    
    generateQRCode(address, true).then(setQrCode);
  }, [networkInfo]);

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1}>
      <Text color="cyan" bold>Connection Info</Text>
      
      <Box marginTop={1} flexDirection="column">
        <Box>
          <Text>LAN IP: </Text>
          <Text color="green">{networkInfo.lanIP}:{networkInfo.port}</Text>
        </Box>

        {networkInfo.publicIP && (
          <Box>
            <Text>Public IP: </Text>
            <Text color={networkInfo.reachable ? 'green' : 'yellow'}>
              {networkInfo.publicIP}:{networkInfo.port}
            </Text>
          </Box>
        )}

        <Box marginTop={1}>
          <Text>UPnP: </Text>
          <Text color={networkInfo.upnpSuccess ? 'green' : 'red'}>
            {networkInfo.upnpSuccess ? 'Enabled' : 'Failed'}
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text>Status: </Text>
          <Text color={networkInfo.reachable ? 'green' : 'yellow'}>
            {networkInfo.reachable ? 'Publicly Accessible' : 'LAN Only'}
          </Text>
        </Box>

        {qrCode && (
          <Box marginTop={1} flexDirection="column">
            <Text color="gray">QR Code for mobile:</Text>
            <Text>{qrCode}</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};