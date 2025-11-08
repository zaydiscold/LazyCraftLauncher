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
import { emergencyCleanup, emergencyCleanupSync } from './core/run.js';

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

// ========================================
// COMPREHENSIVE SHUTDOWN HANDLERS
// ========================================
// These handlers ensure the Minecraft server is ALWAYS shut down
// when the launcher exits, preventing orphaned processes

let isCleaningUp = false;

/**
 * Async cleanup handler for signals that allow async operations
 */
async function handleShutdown(signal: string) {
  if (isCleaningUp) {
    logger.info(`${signal} received but cleanup already in progress`);
    return;
  }

  isCleaningUp = true;
  logger.info(`${signal} received, shutting down gracefully...`);
  console.log(`\n${signal} received, shutting down server...`);

  try {
    await emergencyCleanup();
    logger.info('Graceful shutdown completed');
    console.log('Server stopped successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  handleShutdown('SIGINT');
});

// Handle SIGTERM (kill command)
process.on('SIGTERM', () => {
  handleShutdown('SIGTERM');
});

// Handle SIGHUP (terminal closed)
process.on('SIGHUP', () => {
  handleShutdown('SIGHUP');
});

// Handle SIGQUIT (Ctrl+\)
process.on('SIGQUIT', () => {
  handleShutdown('SIGQUIT');
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  logger.error('Uncaught exception:', error);
  console.error('Uncaught exception:', error);

  if (!isCleaningUp) {
    isCleaningUp = true;
    try {
      await emergencyCleanup();
    } catch (cleanupError) {
      logger.error('Cleanup failed after uncaught exception:', cleanupError);
    }
  }

  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  console.error('Unhandled rejection:', reason);

  if (!isCleaningUp) {
    isCleaningUp = true;
    try {
      await emergencyCleanup();
    } catch (cleanupError) {
      logger.error('Cleanup failed after unhandled rejection:', cleanupError);
    }
  }

  process.exit(1);
});

// Handle process exit - this ALWAYS fires, even on crashes
// MUST be synchronous as async operations are not allowed here
process.on('exit', (code) => {
  logger.info(`Process exiting with code ${code}`);

  // Synchronous cleanup only - no async allowed in 'exit' handler
  if (!isCleaningUp) {
    emergencyCleanupSync();
  }
});

// Handle beforeExit - fires when event loop empties
// This allows async cleanup before the process actually exits
process.on('beforeExit', async (code) => {
  if (!isCleaningUp && code === 0) {
    logger.info('Process finishing, checking for cleanup...');
    isCleaningUp = true;
    try {
      await emergencyCleanup();
    } catch (error) {
      logger.error('Cleanup failed in beforeExit:', error);
    }
  }
});

// Start the application
main();
