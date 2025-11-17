#!/usr/bin/env node
/**
 * LazyCraftLauncher - Main Entry Point
 * "You ask to play, we host for you."
 */

import fs from 'fs-extra';
import open from 'open';
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
    const isAPIOnly = args.includes('--api-only');
    const showHelp = args.includes('--help') || args.includes('-h');

    if (showHelp) {
      console.log(`
LazyCraftLauncher - The lazy way to host Minecraft

Usage:
  lazycraft              Launch web UI (opens in browser)
  lazycraft --api-only   Start API server only (no browser)
  lazycraft --help       Show this help message

Options:
  -h, --help            Show help
  --api-only            Start API server without opening browser

Configuration is saved in .lazycraft.yml
Logs are saved in the logs/ directory
Backups are saved in the backups/ directory

Web UI available at: http://127.0.0.1:8765
      `.trim());
      process.exit(0);
    }

    if (isAPIOnly) {
      // API-only mode (no browser)
      console.log('Starting LazyCraftLauncher API on http://127.0.0.1:8765');
      await startAPI();
      console.log('API server running. Press Ctrl+C to stop.');
      console.log('Web UI available at: http://127.0.0.1:8765');

      // Keep process alive
      process.stdin.resume();
      process.on('SIGINT', () => {
        console.log('Shutting down API server...');
        process.exit(0);
      });
    } else {
      // Web UI mode (default)
      console.log('Starting LazyCraftLauncher...');
      console.log('');
      console.log('╔══════════════════════════════════════╗');
      console.log('║                                      ║');
      console.log('║      LAZY CRAFT LAUNCHER             ║');
      console.log('║                                      ║');
      console.log('║   "You ask to play, we host for you."║');
      console.log('║                                      ║');
      console.log('╚══════════════════════════════════════╝');
      console.log('');

      // Start API server
      await startAPI();
      console.log('API server started on http://127.0.0.1:8765');
      console.log('Opening web UI in your browser...');
      console.log('');
      console.log('If the browser doesn\'t open, visit: http://127.0.0.1:8765');
      console.log('Press Ctrl+C to stop the server.');
      console.log('');

      // Open browser
      try {
        await open('http://127.0.0.1:8765');
      } catch (error) {
        logger.error('Failed to open browser:', error);
        console.log('Could not open browser automatically. Please visit http://127.0.0.1:8765 manually.');
      }

      // Keep process alive
      process.stdin.resume();
      process.on('SIGINT', () => {
        console.log('\nShutting down server...');
        process.exit(0);
      });
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
 * NOTE: The isCleaningUp flag must be set BEFORE calling this function
 * to prevent race conditions with multiple signals
 */
async function handleShutdown(signal: string): Promise<void> {
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

/**
 * Synchronous signal handler wrapper
 * Sets the cleanup flag BEFORE calling async handler to prevent race conditions
 */
function handleSignal(signal: string): void {
  if (isCleaningUp) {
    logger.info(`${signal} received but cleanup already in progress`);
    return;
  }

  // Set flag synchronously to prevent race conditions
  isCleaningUp = true;

  // Call async cleanup (non-blocking)
  handleShutdown(signal).catch((error) => {
    logger.error(`Fatal error in shutdown handler for ${signal}:`, error);
    process.exit(1);
  });
}

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  handleSignal('SIGINT');
});

// Handle SIGTERM (kill command)
process.on('SIGTERM', () => {
  handleSignal('SIGTERM');
});

// Handle SIGHUP (terminal closed)
process.on('SIGHUP', () => {
  handleSignal('SIGHUP');
});

// Handle SIGQUIT (Ctrl+\)
process.on('SIGQUIT', () => {
  handleSignal('SIGQUIT');
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
