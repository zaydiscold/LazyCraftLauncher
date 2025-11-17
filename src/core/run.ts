/**
 * Server Execution Module
 * Manages starting, stopping, and monitoring the Minecraft server
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { execa } from 'execa';
import { getPaths } from '../utils/paths.js';
import { logger } from '../utils/log.js';
import { formatLogDate } from '../utils/date.js';
import { TIMEOUTS, FILES } from '../utils/constants.js';
import { testPortReachability, loadNetworkInfo } from './network.js';
import type { LazyConfig } from '../types/index.js';

let serverProcess: ChildProcess | null = null;
let serverStartTime: Date | null = null;
let isShuttingDown: boolean = false;

const PID_FILE = FILES.PID_FILE;

/**
 * Write PID file for process tracking
 */
async function writePidFile(pid: number): Promise<void> {
  const paths = getPaths();
  const pidPath = path.join(paths.root, PID_FILE);
  try {
    await fs.writeFile(pidPath, pid.toString(), 'utf8');
    logger.info(`Wrote PID file: ${pidPath} (PID: ${pid})`);
  } catch (error) {
    logger.warn('Failed to write PID file:', error);
  }
}

/**
 * Remove PID file
 */
async function removePidFile(): Promise<void> {
  const paths = getPaths();
  const pidPath = path.join(paths.root, PID_FILE);
  try {
    await fs.remove(pidPath);
    logger.info('Removed PID file');
  } catch (error) {
    // Ignore errors when removing PID file
  }
}

/**
 * Read PID from file
 */
async function readPidFile(): Promise<number | null> {
  const paths = getPaths();
  const pidPath = path.join(paths.root, PID_FILE);
  try {
    if (await fs.pathExists(pidPath)) {
      const pidStr = await fs.readFile(pidPath, 'utf8');
      const pid = parseInt(pidStr.trim(), 10);
      return isNaN(pid) ? null : pid;
    }
  } catch (error) {
    logger.warn('Failed to read PID file:', error);
  }
  return null;
}

/**
 * Check if a process is running
 */
function isProcessRunning(pid: number): boolean {
  try {
    // Sending signal 0 checks if process exists without killing it
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Kill process by PID
 */
async function killProcess(pid: number, force: boolean = false): Promise<boolean> {
  try {
    if (!isProcessRunning(pid)) {
      return false;
    }

    logger.info(`Killing process ${pid} (force: ${force})`);
    process.kill(pid, force ? 'SIGKILL' : 'SIGTERM');

    // Wait a bit to see if it dies
    await new Promise(resolve => setTimeout(resolve, TIMEOUTS.PROCESS_KILL_CHECK));

    if (isProcessRunning(pid)) {
      if (!force) {
        // Try force kill
        logger.warn(`Process ${pid} didn't respond to SIGTERM, force killing`);
        process.kill(pid, 'SIGKILL');
        await new Promise(resolve => setTimeout(resolve, TIMEOUTS.FORCE_KILL_RETRY));
      }
    }

    return !isProcessRunning(pid);
  } catch (error) {
    logger.error(`Failed to kill process ${pid}:`, error);
    return false;
  }
}

/**
 * Clean up any orphaned server process from previous run
 */
async function cleanupOrphanedProcess(): Promise<void> {
  const pid = await readPidFile();

  if (pid !== null) {
    logger.info(`Found PID file with PID ${pid}, checking if process is still running...`);

    if (isProcessRunning(pid)) {
      logger.warn(`Found orphaned server process (PID: ${pid}), cleaning up...`);
      console.log('⚠ Found orphaned server from previous run, cleaning up...');

      const killed = await killProcess(pid, false);
      if (killed) {
        logger.info('Successfully killed orphaned process');
        console.log('✓ Cleaned up orphaned server process');
      } else {
        logger.warn('Failed to kill orphaned process, may need manual cleanup');
        console.log('⚠ Failed to kill orphaned process. You may need to manually kill it.');
      }
    } else {
      logger.info('PID file exists but process is not running (stale PID file)');
    }

    // Remove stale PID file
    await removePidFile();
  }
}

/**
 * Start the Minecraft server
 */
export async function startServer(config: LazyConfig): Promise<ChildProcess> {
  // Clean up any orphaned process first
  await cleanupOrphanedProcess();
  const paths = getPaths();
  const serverDir = paths.root;
  const serverJar = path.join(serverDir, 'server.jar');
  
  // Verify server.jar exists
  if (!await fs.pathExists(serverJar)) {
    throw new Error('server.jar not found. Run setup first.');
  }
  
  // Prepare Java arguments
  const javaPath = config.javaPath || 'java';
  const minRAM = `${config.ramGB}G`;
  const maxRAM = `${config.ramGB}G`;
  
  const args = [
    `-Xms${minRAM}`,
    `-Xmx${maxRAM}`,
    '-jar',
    serverJar,
    'nogui',
  ];
  
  logger.info(`Starting server with command: ${javaPath} ${args.join(' ')}`);
  console.log('Starting server... Try not to blow up the spawn this time.');
  
  // Start the server process
  serverProcess = spawn(javaPath, args, {
    cwd: serverDir,
    stdio: ['pipe', 'pipe', 'pipe'],
    // Ensure child process is killed when parent dies
    detached: false,
  });

  serverStartTime = new Date();

  // Write PID file for tracking
  if (serverProcess.pid) {
    await writePidFile(serverProcess.pid);
  }
  
  // Setup log file
  const logFile = path.join(paths.logs, `server-${formatLogDate(serverStartTime)}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  
  // Handle stdout
  serverProcess.stdout?.on('data', (data) => {
    const text = data.toString();
    logStream.write(text);
    
    // Check for server ready message
    if (text.includes('Done') && text.includes('For help, type')) {
      console.log('\nServer is up. Your friends can connect now!');
      onServerReady(config);
    }
    
    // Parse for player joins/leaves
    if (text.includes('joined the game')) {
      const playerMatch = text.match(/(\w+) joined the game/);
      if (playerMatch) {
        logger.info(`Player joined: ${playerMatch[1]}`);
      }
    }
    
    if (text.includes('left the game')) {
      const playerMatch = text.match(/(\w+) left the game/);
      if (playerMatch) {
        logger.info(`Player left: ${playerMatch[1]}`);
      }
    }
  });
  
  // Handle stderr
  serverProcess.stderr?.on('data', (data) => {
    const text = data.toString();
    logStream.write(text);
    logger.error('Server error:', text);
  });
  
  // Handle process exit
  serverProcess.on('exit', (code, signal) => {
    logger.info(`Server process exited with code ${code} and signal ${signal}`);
    logStream.end();
    serverProcess = null;
    serverStartTime = null;

    // Remove PID file
    removePidFile().catch(err => {
      logger.warn('Failed to remove PID file on exit:', err);
    });
  });
  
  // Handle process error
  serverProcess.on('error', (error) => {
    logger.error('Failed to start server:', error);
    logStream.end();
    throw error;
  });
  
  return serverProcess;
}

/**
 * Stop the server
 */
export async function stopServer(): Promise<void> {
  // Prevent double-shutdown
  if (isShuttingDown) {
    logger.info('Shutdown already in progress, skipping');
    return;
  }

  if (!serverProcess) {
    logger.warn('No server process to stop');
    await removePidFile(); // Clean up PID file even if no process
    return;
  }

  isShuttingDown = true;

  logger.info('Stopping server...');
  console.log('Stopping server... Saving your world first.');

  // Send stop command to server for graceful shutdown
  if (serverProcess.stdin && !serverProcess.killed) {
    try {
      serverProcess.stdin.write('stop\n');
    } catch (error) {
      logger.warn('Failed to send stop command:', error);
    }
  }

  // Wait for graceful shutdown (max 30 seconds)
  return new Promise((resolve) => {
    let timeout: NodeJS.Timeout;

    const cleanup = async () => {
      clearTimeout(timeout);
      await removePidFile();
      serverProcess = null;
      serverStartTime = null;
      isShuttingDown = false;
      resolve();
    };

    if (serverProcess) {
      serverProcess.once('exit', cleanup);

      timeout = setTimeout(() => {
        // Force kill if not stopped after graceful shutdown timeout
        if (serverProcess && !serverProcess.killed) {
          logger.warn('Force killing server process after timeout');
          try {
            serverProcess.kill('SIGKILL');
          } catch (error) {
            logger.error('Failed to force kill server:', error);
          }
        }
        cleanup();
      }, TIMEOUTS.GRACEFUL_SHUTDOWN);
    } else {
      cleanup();
    }
  });
}

/**
 * Restart the server
 */
export async function restartServer(config: LazyConfig): Promise<ChildProcess> {
  logger.info('Restarting server...');
  
  if (serverProcess) {
    await stopServer();
    // Wait a bit for ports to be released
    await new Promise(resolve => setTimeout(resolve, TIMEOUTS.SERVER_RESTART_DELAY));
  }
  
  return startServer(config);
}

/**
 * Send command to server console
 */
export function sendCommand(command: string): boolean {
  if (!serverProcess || !serverProcess.stdin) {
    logger.warn('Cannot send command: server not running');
    return false;
  }
  
  serverProcess.stdin.write(`${command}\n`);
  logger.info(`Sent command: ${command}`);
  return true;
}

/**
 * Get server uptime in seconds
 */
export function getUptime(): number {
  if (!serverStartTime) {
    return 0;
  }
  
  const now = new Date();
  const uptimeMs = now.getTime() - serverStartTime.getTime();
  return Math.floor(uptimeMs / 1000);
}

/**
 * Check if server is running
 */
export function isServerRunning(): boolean {
  return serverProcess !== null && !serverProcess.killed;
}

/**
 * Get server process info
 */
export function getServerProcess(): ChildProcess | null {
  return serverProcess;
}

/**
 * Called when server is ready
 */
async function onServerReady(config: LazyConfig): Promise<void> {
  logger.info('Server is ready!');
  
  // Test port reachability after server is ready
  setTimeout(async () => {
    const networkInfo = await loadNetworkInfo();
    
    if (networkInfo && networkInfo.publicIP) {
      const reachable = await testPortReachability(networkInfo.publicIP, config.port);
      
      networkInfo.reachable = reachable;
      networkInfo.lastChecked = new Date().toISOString();
      try {
        const paths = getPaths();
        await fs.writeJson(path.join(paths.root, '.network-info.json'), networkInfo, { spaces: 2 });
      } catch (error) {
        logger.warn('Failed to persist reachability status:', error);
      }
      
      if (reachable) {
        console.log('\n✓ Your friends can connect from anywhere!');
        console.log(`Public address: ${networkInfo.publicIP}:${config.port}`);
      } else {
        console.log('\n⚠ Local only access. Try manually forwarding port or use Tailscale.');
        console.log(`LAN address: ${networkInfo.lanIP}:${config.port}`);
      }
    }
  }, TIMEOUTS.SERVER_READY_CHECK);
}

/**
 * Kill all Java processes (emergency cleanup)
 */
export async function killAllJavaProcesses(): Promise<void> {
  try {
    if (process.platform === 'win32') {
      await execa('taskkill', ['/F', '/IM', 'java.exe'], { reject: false });
    } else {
      await execa('pkill', ['-f', 'minecraft'], { reject: false });
    }
    logger.info('Killed all Java processes');
  } catch (error) {
    logger.error('Error killing Java processes:', error);
  }
}

/**
 * Emergency cleanup function - can be called from signal handlers
 * This function ensures the server is stopped even if the application crashes
 */
export async function emergencyCleanup(): Promise<void> {
  logger.info('Emergency cleanup triggered');

  // Try graceful shutdown first
  try {
    await stopServer();
  } catch (error) {
    logger.error('Graceful shutdown failed during emergency cleanup:', error);

    // Force kill as last resort
    if (serverProcess && !serverProcess.killed) {
      try {
        logger.warn('Force killing server process in emergency cleanup');
        serverProcess.kill('SIGKILL');
      } catch (killError) {
        logger.error('Failed to force kill in emergency cleanup:', killError);
      }
    }

    // Clean up PID file
    await removePidFile();
  }
}

/**
 * Synchronous emergency cleanup for process.on('exit')
 * Must be synchronous as process.on('exit') doesn't support async
 */
export function emergencyCleanupSync(): void {
  logger.info('Synchronous emergency cleanup triggered');

  // Force kill immediately (no time for graceful shutdown)
  if (serverProcess && !serverProcess.killed) {
    try {
      logger.warn('Force killing server process in synchronous cleanup');
      serverProcess.kill('SIGKILL');
    } catch (error) {
      logger.error('Failed to force kill in sync cleanup:', error);
    }
  }

  // Try to remove PID file synchronously
  try {
    const paths = getPaths();
    const pidPath = path.join(paths.root, PID_FILE);
    if (fs.existsSync(pidPath)) {
      fs.unlinkSync(pidPath);
      logger.info('Removed PID file in sync cleanup');
    }
  } catch (error) {
    logger.warn('Failed to remove PID file in sync cleanup:', error);
  }
}
