/**
 * Status panel displayed on dashboard
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { LazyConfig, ServerStatus } from '../../types/index.js';
import { theme } from '../theme.js';

interface StatusPanelProps {
  status: ServerStatus | null;
  config: LazyConfig;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ status, config }) => {
  if (!status) {
    return (
      <Box flexDirection="column" borderStyle="single" paddingX={1}>
        <Text color={theme.accent} bold>Status</Text>
        <Box marginTop={1}>
          <Text color={theme.muted}>Collecting server stats...</Text>
        </Box>
      </Box>
    );
  }

  const statusColor = status.running ? theme.success : theme.error;
  const reachabilityColor = status.reachable ? theme.success : theme.warning;

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1}>
      <Text color={theme.accent} bold>Status</Text>

      <Box marginTop={1} flexDirection="column">
        <Box>
          <Text>Status: </Text>
          <Text color={statusColor}>{status.running ? 'Online' : 'Offline'}</Text>
        </Box>

        <Box>
          <Text>Uptime: </Text>
          <Text>{formatUptime(status.uptime)}</Text>
        </Box>

        <Box>
          <Text>Players: </Text>
          <Text>
            {status.playersOnline}/{status.maxPlayers}
          </Text>
        </Box>

        <Box>
          <Text>Version: </Text>
          <Text>{status.version || config.minecraftVersion}</Text>
        </Box>

        <Box>
          <Text>Port: </Text>
          <Text>{status.port}</Text>
        </Box>

        <Box>
          <Text>Reachability: </Text>
          <Text color={reachabilityColor}>
            {status.reachable ? 'Public' : 'LAN only'}
          </Text>
        </Box>

        {status.lastLogLine && (
          <Box marginTop={1} flexDirection="column">
            <Text color={theme.muted}>Last log:</Text>
            <Text color={theme.highlight}>{truncate(status.lastLogLine, 70)}</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

function formatUptime(seconds: number): string {
  if (!seconds || seconds < 1) {
    return '0s';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (remainingSeconds || parts.length === 0) parts.push(`${remainingSeconds}s`);

  return parts.join(' ');
}

function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1)}…`;
}
