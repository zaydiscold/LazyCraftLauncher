#!/usr/bin/env node
/**
 * LazyCraftLauncher - Main Entry Point
 * "You ask to play, we host for you."
 */

import { render } from 'ink';
import React from 'react';
import fs from 'fs-extra';
import path from 'path';
import { App } from './cli.js';
import { startAPI } from './core/api.js';
import { getPaths } from './utils/paths.js';
import { logger } from './utils/log.js';

async function main() {
  try {
    // Initialize working directory
    const paths = getPaths();
    await fs.ensureDir(paths.root);
    await fs.ensureDir(paths.logs);
    await fs.ensureDir(paths.backups);
    await fs.ensureDir(paths.temp);

    // Check for command line arguments
    const args = process.argv.slice(2);
    const isQuickMode = args.includes('--quick') || args.includes('-q');
    const isAPIOnly = args.includes('--api-only');
    const showHelp = args.includes('--help') || args.includes('-h');

    if (showHelp) {
      console.log(`
LazyCraftLauncher - The lazy way to host Minecraft

Usage:
  lazycraft              Launch interactive setup wizard
  lazycraft --quick      Quick launch with saved config
  lazycraft --api-only   Start API server only (for external UIs)
  lazycraft --help       Show this help message

Options:
  -q, --quick           Quick launch mode
  -h, --help            Show help
  --api-only            Start API server only

Configuration is saved in .lazycraft.yml
Logs are saved in the logs/ directory
Backups are saved in the backups/ directory
      `.trim());
      process.exit(0);
    }

    // Start API server if not in API-only mode (always runs alongside UI)
    if (!isAPIOnly) {
      startAPI().catch(err => {
        logger.error('Failed to start API server:', err);
      });
    }

    const supportsRawMode = Boolean(
      process.stdin.isTTY && typeof (process.stdin as any).setRawMode === 'function'
    );

    if (isAPIOnly) {
      // API-only mode
      console.log('Starting LazyCraftLauncher API on http://127.0.0.1:8765');
      await startAPI();
      console.log('API server running. Press Ctrl+C to stop.');
      
      // Keep process alive
      process.stdin.resume();
      process.on('SIGINT', () => {
        console.log('Shutting down API server...');
        process.exit(0);
      });
    } else {
      if (!supportsRawMode) {
        console.error('Interactive mode requires a TTY with raw mode support.');
        console.error('Run this launcher from a terminal window, or use `lazycraft --quick`.');
        process.exit(1);
      }

      // Launch interactive UI
      const { waitUntilExit } = render(
        React.createElement(App, { quickMode: isQuickMode })
      );

      await waitUntilExit();
    }
  } catch (error) {
    logger.error('Fatal error:', error);
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

// Start the application
main();
