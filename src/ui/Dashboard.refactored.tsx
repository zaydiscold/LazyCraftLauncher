/**
 * Server Dashboard Component (Refactored)
 *
 * This is a cleaner, more maintainable version of the dashboard that uses:
 * - Custom hooks for state management and business logic
 * - Better separation of concerns
 * - Clearer component structure
 *
 * **Architecture:**
 * - `useDashboard` hook manages all state, polling, and actions
 * - Existing UI components (StatusPanel, AddressPanel, ActionButtons) for display
 * - This component focuses only on layout and presentation
 *
 * @module ui/Dashboard
 */

import React from 'react';
import { Box, Text } from 'ink';
import { StatusPanel } from './components/StatusPanel.js';
import { AddressPanel } from './components/AddressPanel.js';
import { ActionButtons } from './components/ActionButtons.js';
import { Banner } from './components/Banner.js';
import { useDashboard, DashboardAction } from './hooks/useDashboard.js';
import type { LazyConfig, NetworkInfo } from '../types/index.js';

/**
 * Props for the Dashboard component
 */
interface DashboardProps {
  /** Current launcher configuration */
  config: LazyConfig;
  /** Network configuration and status */
  networkInfo: NetworkInfo;
  /** Running server process */
  serverProcess: any;
  /** Callback when user requests to stop the server */
  onStop: () => void;
  /** Optional callback for server restart */
  onRestart?: () => void;
}

/**
 * Server Dashboard Component
 *
 * Displays live server status and provides controls for managing the server.
 *
 * **Features:**
 * - Real-time status updates (every 5 seconds)
 * - Server control actions (restart, backup, stop)
 * - Network connectivity information
 * - Player tracking
 * - Resource monitoring (RAM, uptime)
 *
 * **Keyboard Controls:**
 * - Arrow Keys: Navigate between actions
 * - Enter: Execute selected action
 * - Q/Esc: Quit (stop server and exit)
 * - B: Quick backup
 * - R: Quick restart
 *
 * @param props - Component props
 * @returns React component
 */
export const Dashboard: React.FC<DashboardProps> = ({
  config,
  networkInfo,
  serverProcess,
  onStop,
  onRestart,
}) => {
  // Use custom hook for dashboard state and logic
  const dashboard = useDashboard({
    config,
    networkInfo,
    serverProcess,
    onStop,
    onRestart,
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header Banner */}
      <Banner />

      {/* Main Content: Status and Connection Info */}
      <Box marginTop={1} flexDirection="row" gap={2}>
        {/* Left Column: Server Status */}
        <Box flexDirection="column" width="50%">
          <StatusPanel status={dashboard.status} config={config} />
        </Box>

        {/* Right Column: Connection Info */}
        <Box flexDirection="column" width="50%">
          <AddressPanel networkInfo={networkInfo} />
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box marginTop={2}>
        <ActionButtons
          selectedIndex={dashboard.selectedAction}
          onSelect={(index) => dashboard.executeAction(index as DashboardAction)}
        />
      </Box>

      {/* Status Message Display */}
      {dashboard.message && (
        <Box marginTop={1} borderStyle="round" borderColor="yellow" padding={1}>
          <Text color="yellow">⏳ {dashboard.message}</Text>
        </Box>
      )}

      {/* Network Reachability Status */}
      <Box marginTop={2}>
        {networkInfo.reachable ? (
          <Box flexDirection="column">
            <Text color="green" bold>
              ✅ Server is publicly accessible!
            </Text>
            <Text color="gray">
              Friends anywhere can connect using: {networkInfo.publicIP}:
              {networkInfo.port}
            </Text>
          </Box>
        ) : (
          <Box flexDirection="column">
            <Text color="yellow" bold>
              ⚠️  Server is LAN-only (local network access)
            </Text>
            <Text color="gray">
              LAN address: {networkInfo.lanIP}:{networkInfo.port}
            </Text>
            {!networkInfo.upnpSuccess && (
              <Box marginTop={1}>
                <Text color="gray">
                  💡 UPnP failed - You may need to configure port forwarding manually.
                </Text>
              </Box>
            )}
            <Box marginTop={1}>
              <Text color="gray">
                For internet access, see Connection Info panel for manual setup steps →
              </Text>
            </Box>
          </Box>
        )}
      </Box>

      {/* Help Text / Keyboard Controls */}
      <Box marginTop={2} borderStyle="single" borderColor="cyan" padding={1}>
        <Box flexDirection="column">
          <Text bold underline>
            Keyboard Controls:
          </Text>
          <Box marginTop={1} flexDirection="column">
            <Text>
              <Text color="cyan">← →</Text> Navigate actions
              {' | '}
              <Text color="cyan">Enter</Text> Execute
              {' | '}
              <Text color="cyan">Q/Esc</Text> Quit
            </Text>
            <Text>
              <Text color="cyan">B</Text> Quick backup
              {' | '}
              <Text color="cyan">R</Text> Quick restart
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Status updates every 5 seconds • Press Q or Esc to stop server and quit
        </Text>
      </Box>
    </Box>
  );
};
