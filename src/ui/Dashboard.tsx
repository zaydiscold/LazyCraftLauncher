/**
 * Server Dashboard Component
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { StatusPanel } from './components/StatusPanel.js';
import { AddressPanel } from './components/AddressPanel.js';
import { ActionButtons } from './components/ActionButtons.js';
import { Banner } from './components/Banner.js';
import { getServerStatus } from '../core/status.js';
import { createBackup } from '../core/backup.js';
import type { LazyConfig, NetworkInfo, ServerStatus } from '../types/index.js';

interface DashboardProps {
  config: LazyConfig;
  networkInfo: NetworkInfo;
  serverProcess: any;
  onStop: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  config,
  networkInfo,
  serverProcess,
  onStop
}) => {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [selectedAction, setSelectedAction] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.leftArrow) {
      setSelectedAction(Math.max(0, selectedAction - 1));
    } else if (key.rightArrow) {
      setSelectedAction(Math.min(2, selectedAction + 1));
    } else if (key.return) {
      handleAction(selectedAction);
    } else if (input === 'q' || key.escape) {
      handleStop();
    }
  });

  useEffect(() => {
    const interval = setInterval(async () => {
      const newStatus = await getServerStatus(config, networkInfo, serverProcess);
      setStatus(newStatus);
    }, 5000);

    // Initial status
    getServerStatus(config, networkInfo, serverProcess).then(setStatus);

    return () => clearInterval(interval);
  }, [config, networkInfo, serverProcess]);

  const handleAction = async (action: number) => {
    switch (action) {
      case 0: // Restart
        setMessage('Restarting server...');
        if (serverProcess) {
          await serverProcess.kill();
          // TODO: Implement restart logic
        }
        break;
      case 1: // Backup
        setMessage('Creating backup...');
        await createBackup(config.worldPath);
        setMessage('Backup created successfully!');
        setTimeout(() => setMessage(null), 3000);
        break;
      case 2: // Stop
        handleStop();
        break;
    }
  };

  const handleStop = async () => {
    setMessage('Stopping server and creating backup...');
    if (config.backupOnExit !== false) {
      await createBackup(config.worldPath);
    }
    onStop();
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Banner />
      
      <Box marginTop={1} flexDirection="row" gap={2}>
        <Box flexDirection="column" width="50%">
          <StatusPanel status={status} config={config} />
        </Box>
        
        <Box flexDirection="column" width="50%">
          <AddressPanel networkInfo={networkInfo} />
        </Box>
      </Box>

      <Box marginTop={2}>
        <ActionButtons
          selectedIndex={selectedAction}
          onSelect={handleAction}
        />
      </Box>

      {message && (
        <Box marginTop={1}>
          <Text color="yellow">{message}</Text>
        </Box>
      )}

      <Box marginTop={2}>
        <Text color="gray">
          Use arrow keys to select action, Enter to execute, Q or Esc to quit
        </Text>
      </Box>

      {networkInfo.reachable ? (
        <Box marginTop={1}>
          <Text color="green" bold>✓ Your friends can connect!</Text>
        </Box>
      ) : (
        <Box marginTop={1} flexDirection="column">
          <Text color="yellow" bold>⚠ Local only access</Text>
          <Text color="gray">Try: UPnP in router, manual port forward, or Tailscale</Text>
        </Box>
      )}
    </Box>
  );
};