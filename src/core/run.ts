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
import { testPortReachability } from './network.js';
import type { LazyConfig } from '../types/index.js';

let serverProcess: ChildProcess | null = null;
let serverStartTime: Date | null = null;

/**
 * Start the Minecraft server
 */
export async function startServer(config: LazyConfig): Promise<ChildProcess> {
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
  });
  
  serverStartTime = new Date();
  
  // Setup log file
  const logFile = path.join(paths.logs, `server-${formatDate(serverStartTime)}.log`);
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
  if (!serverProcess) {
    logger.warn('No server process to stop');
    return;
  }
  
  logger.info('Stopping server...');
  console.log('Stopping server... Saving your world first.');
  
  // Send stop command to server
  if (serverProcess.stdin) {
    serverProcess.stdin.write('stop\n');
  }
  
  // Wait for graceful shutdown (max 30 seconds)
  return new Promise((resolve) => {
    let timeout: NodeJS.Timeout;
    
    const cleanup = () => {
      clearTimeout(timeout);
      serverProcess = null;
      serverStartTime = null;
      resolve();
    };
    
    if (serverProcess) {
      serverProcess.once('exit', cleanup);
      
      timeout = setTimeout(() => {
        // Force kill if not stopped after 30 seconds
        if (serverProcess) {
          logger.warn('Force killing server process');
          serverProcess.kill('SIGKILL');
        }
        cleanup();
      }, 30000);
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
    await new Promise(resolve => setTimeout(resolve, 2000));
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
  
  // Test port reachability after a short delay
  setTimeout(async () => {
    const paths = getPaths();
    const networkInfo = await loadNetworkInfo(paths.root);
    
    if (networkInfo && networkInfo.publicIP) {
      const reachable = await testPortReachability(networkInfo.publicIP, config.port);
      
      networkInfo.reachable = reachable;
      networkInfo.lastChecked = new Date().toISOString();
      try {
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
  }, 5000);
}

/**
 * Load network info from file
 */
async function loadNetworkInfo(serverDir: string): Promise<any> {
  try {
    const infoPath = path.join(serverDir, '.network-info.json');
    if (await fs.pathExists(infoPath)) {
      return await fs.readJson(infoPath);
    }
  } catch (error) {
    logger.error('Error loading network info:', error);
  }
  return null;
}

/**
 * Format date for log filename
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
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
