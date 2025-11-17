/**
 * Dashboard State Management Hook
 *
 * This custom React hook manages the state and action logic for the
 * server dashboard. It separates business logic from UI components.
 *
 * **Features:**
 * - Server status polling
 * - Action button navigation
 * - Server control (restart, backup, stop)
 * - Keyboard input handling
 *
 * @module ui/hooks/useDashboard
 */

import { useState, useEffect } from 'react';
import { useInput } from 'ink';
import { getServerStatus } from '../../core/status.js';
import { createBackup } from '../../core/backup.js';
import type { LazyConfig, NetworkInfo, ServerStatus } from '../../types/index.js';

/**
 * Available dashboard actions
 */
export enum DashboardAction {
  Restart = 0,
  Backup = 1,
  Stop = 2,
}

/**
 * Dashboard state and actions returned by the hook
 */
export interface DashboardState {
  // Current state
  status: ServerStatus | null;
  selectedAction: DashboardAction;
  message: string | null;

  // Status polling
  isPolling: boolean;

  // Actions
  executeAction: (action: DashboardAction) => Promise<void>;
  setMessage: (message: string | null) => void;
}

/**
 * Options for the useDashboard hook
 */
interface UseDashboardOptions {
  config: LazyConfig;
  networkInfo: NetworkInfo;
  serverProcess: any;
  onStop: () => void;
  onRestart?: () => void;
}

/**
 * Custom hook for managing dashboard state and logic
 *
 * @param options - Configuration options
 * @returns Dashboard state and action methods
 *
 * @example
 * ```typescript
 * const dashboard = useDashboard({
 *   config,
 *   networkInfo,
 *   serverProcess,
 *   onStop: handleStop,
 * });
 *
 * // Execute an action
 * await dashboard.executeAction(DashboardAction.Backup);
 *
 * // Access current status
 * console.log(dashboard.status?.playerCount);
 * ```
 */
export function useDashboard(options: UseDashboardOptions): DashboardState {
  const { config, networkInfo, serverProcess, onStop, onRestart } = options;

  // State
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [selectedAction, setSelectedAction] = useState<DashboardAction>(
    DashboardAction.Restart
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  /**
   * Poll server status every 5 seconds
   */
  useEffect(() => {
    if (!isPolling) return;

    // Initial status fetch
    getServerStatus(config, networkInfo, serverProcess).then(setStatus);

    // Set up polling interval
    const interval = setInterval(async () => {
      const newStatus = await getServerStatus(config, networkInfo, serverProcess);
      setStatus(newStatus);
    }, 5000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [config, networkInfo, serverProcess, isPolling]);

  /**
   * Handle keyboard input for navigation and actions
   */
  useInput((input, key) => {
    // Left arrow: previous action
    if (key.leftArrow) {
      setSelectedAction((prev) => Math.max(DashboardAction.Restart, prev - 1));
    }

    // Right arrow: next action
    else if (key.rightArrow) {
      setSelectedAction((prev) => Math.min(DashboardAction.Stop, prev + 1));
    }

    // Enter: execute selected action
    else if (key.return) {
      executeAction(selectedAction);
    }

    // Q or Esc: quit
    else if (input === 'q' || key.escape) {
      handleStop();
    }

    // B: quick backup
    else if (input === 'b' || input === 'B') {
      executeAction(DashboardAction.Backup);
    }

    // R: quick restart
    else if (input === 'r' || input === 'R') {
      executeAction(DashboardAction.Restart);
    }
  });

  /**
   * Execute a dashboard action
   *
   * @param action - The action to execute
   */
  const executeAction = async (action: DashboardAction): Promise<void> => {
    switch (action) {
      case DashboardAction.Restart:
        await handleRestart();
        break;

      case DashboardAction.Backup:
        await handleBackup();
        break;

      case DashboardAction.Stop:
        await handleStop();
        break;
    }
  };

  /**
   * Handle server restart action
   */
  const handleRestart = async (): Promise<void> => {
    setMessage('Restarting server...');
    setIsPolling(false);

    try {
      if (serverProcess) {
        // Stop the server
        await serverProcess.kill();

        // Wait for shutdown
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Call restart handler if provided
        if (onRestart) {
          onRestart();
        }

        setMessage('Server restarted successfully!');
      }
    } catch (error) {
      setMessage(`Failed to restart server: ${error}`);
    } finally {
      setIsPolling(true);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  /**
   * Handle backup action
   */
  const handleBackup = async (): Promise<void> => {
    setMessage('Creating backup...');

    try {
      const backupInfo = await createBackup(config.worldPath);
      setMessage(
        `Backup created successfully! (${(backupInfo.size / 1024 / 1024).toFixed(1)} MB)`
      );
    } catch (error) {
      setMessage(`Failed to create backup: ${error}`);
    } finally {
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    }
  };

  /**
   * Handle stop action
   */
  const handleStop = async (): Promise<void> => {
    setMessage('Stopping server...');
    setIsPolling(false);

    try {
      // Create backup if enabled
      if (config.backupOnExit !== false) {
        setMessage('Creating backup before stopping...');
        await createBackup(config.worldPath);
      }

      // Call stop handler
      onStop();
    } catch (error) {
      setMessage(`Error during shutdown: ${error}`);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return {
    status,
    selectedAction,
    message,
    isPolling,
    executeAction,
    setMessage,
  };
}
