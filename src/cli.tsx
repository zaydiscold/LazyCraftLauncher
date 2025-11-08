/**
 * CLI Application Entry Component
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import gradient from 'gradient-string';
import { Wizard } from './ui/Wizard.js';
import { Dashboard } from './ui/Dashboard.js';
import { loadConfig, saveConfig } from './core/config.js';
import { detectSystem } from './core/detect.js';
import { ensureJava } from './core/java.js';
import { setupServer } from './core/serverJar.js';
import { acceptEULA } from './core/eula.js';
import { setupNetwork } from './core/network.js';
import { startServer, stopServer } from './core/run.js';
import { createBackup } from './core/backup.js';
import { createReport } from './core/report.js';
import { Banner } from './ui/components/Banner.js';
import { logger } from './utils/log.js';
import type { LazyConfig, SystemInfo, NetworkInfo } from './types/index.js';

interface AppProps {
  quickMode?: boolean;
}

type AppState = 'loading' | 'wizard' | 'setup' | 'dashboard' | 'error';

export const App: React.FC<AppProps> = ({ quickMode = false }) => {
  const { exit } = useApp();
  const [state, setState] = useState<AppState>('loading');
  const [config, setConfig] = useState<LazyConfig | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [serverProcess, setServerProcess] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [setupProgress, setSetupProgress] = useState<string>('');

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      // Show ASCII art
      console.clear();
      console.log(gradient.rainbow(getBanner()));
      console.log('');

      // Detect system
      const sysInfo = await detectSystem();
      setSystemInfo(sysInfo);

      // Load saved config
      const savedConfig = await loadConfig();

      if (quickMode && savedConfig) {
        // Quick mode with saved config
        setConfig(savedConfig);
        setState('setup');
        await runSetup(savedConfig, sysInfo);
      } else if (savedConfig && quickMode === false) {
        // Ask if they want to use saved config
        setConfig(savedConfig);
        setState('wizard');
      } else {
        // New setup
        setState('wizard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
    }
  };

  const runSetup = async (cfg: LazyConfig, sysInfo: SystemInfo) => {
    try {
      setState('setup');
      
      // Step 1: Ensure Java
      setSetupProgress('Checking Java installation...');
      const javaPath = await ensureJava(sysInfo);
      cfg.javaPath = javaPath;

      // Step 2: Setup server JAR
      setSetupProgress('Setting up server files...');
      await setupServer(cfg);

      // Step 3: Accept EULA
      setSetupProgress('Handling EULA...');
      await acceptEULA();
      cfg.eulaAccepted = true;

      // Step 4: Setup networking
      setSetupProgress('Configuring network...');
      const netInfo = await setupNetwork(cfg.port, sysInfo.os, cfg.javaPath);
      setNetworkInfo(netInfo);

      // Step 5: Start server
      setSetupProgress('Starting server...');
      const process = await startServer(cfg);
      setServerProcess(process);

      // Step 6: Create report
      await createReport({
        config: cfg,
        systemInfo: sysInfo,
        networkInfo: netInfo,
      });

      // Save config
      await saveConfig(cfg);

      // Show dashboard
      setState('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
      setState('error');
    }
  };

  const handleWizardComplete = async (answers: any) => {
    const newConfig: LazyConfig = {
      version: '1.0.0',
      serverType: answers.serverType || 'vanilla',
      minecraftVersion: answers.minecraftVersion || 'latest',
      worldPath: answers.worldPath || './world',
      isNewWorld: answers.worldChoice === 'new',
      port: answers.port || 25565,
      ramGB: answers.ramGB || 2,
      profile: answers.profile || 'survival-default',
      upnpEnabled: answers.upnp !== false,
      backupOnExit: answers.backup !== false,
      lastRun: new Date().toISOString(),
    };

    setConfig(newConfig);
    await runSetup(newConfig, systemInfo!);
  };

  const handleStop = async () => {
    try {
      logger.info('User initiated shutdown from dashboard');

      // Create backup if enabled
      if (config && config.backupOnExit) {
        console.log('\nCreating backup before shutdown...');
        try {
          await createBackup(config.worldPath);
          console.log('✓ Backup completed');
        } catch (backupError) {
          logger.error('Backup failed during shutdown:', backupError);
          console.log('⚠ Backup failed, continuing with shutdown');
        }
      }

      // Stop server gracefully
      if (serverProcess) {
        await stopServer();
        setServerProcess(null);
      }

      logger.info('Shutdown completed successfully');
    } catch (error) {
      logger.error('Error during shutdown:', error);
      console.error('Error during shutdown:', error);
    } finally {
      exit();
    }
  };

  if (state === 'loading') {
    return (
      <Box>
        <Text color="yellow">Initializing...</Text>
      </Box>
    );
  }

  if (state === 'error') {
    return (
      <Box flexDirection="column">
        <Text color="red" bold>Error:</Text>
        <Text color="red">{error}</Text>
        <Text color="gray">Press Ctrl+C to exit</Text>
      </Box>
    );
  }

  if (state === 'wizard') {
    return (
      <Wizard
        savedConfig={config}
        systemInfo={systemInfo!}
        onComplete={handleWizardComplete}
      />
    );
  }

  if (state === 'setup') {
    return (
      <Box flexDirection="column" padding={1}>
        <Banner />
        <Box marginTop={1}>
          <Text color="cyan">Setting up server...</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray">{setupProgress}</Text>
        </Box>
      </Box>
    );
  }

  if (state === 'dashboard') {
    return (
      <Dashboard
        config={config!}
        networkInfo={networkInfo!}
        serverProcess={serverProcess}
        onStop={handleStop}
      />
    );
  }

  return null;
};

function getBanner(): string {
  return `
===================================
   LAZY CRAFT LAUNCHER
   "You ask to play, we host for you."
===================================`;
}