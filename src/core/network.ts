/**
 * Network Configuration Module
 * Handles UPnP, firewall, port testing
 */

import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import got from 'got';
import NatAPI from 'nat-api';
import net from 'net';
import { execa } from 'execa';
import { logger } from '../utils/log.js';
import { getLocalIP } from './detect.js';
import { getPaths } from '../utils/paths.js';
import {
  getWindowsFirewallAddArgs,
  getWindowsFirewallRemoveArgs,
  getWindowsFirewallManualSteps,
} from '../platform/windows.js';
import {
  getMacFirewallCommands,
  getMacFirewallManualSteps,
  getMacFirewallRemoveCommand,
} from '../platform/mac.js';
import type { NetworkInfo } from '../types/index.js';
import { isElevated } from '../utils/permissions.js';

/**
 * Setup network configuration
 */
export async function setupNetwork(
  port: number,
  osType: 'windows' | 'mac' | 'linux',
  javaPath?: string
): Promise<NetworkInfo> {
  logger.info('Setting up network configuration...');

  // Get local IP
  const lanIP = getLocalIP();

  // Get public IP with fallback services
  const publicIP = await getPublicIP();

  // Setup UPnP with retry logic
  const upnpSuccess = await setupUPnP(port);

  // Setup firewall with correct Java path
  await setupFirewall(port, osType, javaPath);

  // Test reachability (after server starts)
  // Initial status - will be updated after server starts
  const networkInfo: NetworkInfo = {
    lanIP,
    publicIP,
    port,
    upnpSuccess,
    reachable: false,
  };

  await persistNetworkInfo(networkInfo);

  return networkInfo;
}

/**
 * Get public IP address with multiple fallback services
 */
async function getPublicIP(): Promise<string | undefined> {
  const services = [
    'https://api.ipify.org',
    'https://icanhazip.com',
    'https://ifconfig.me/ip',
    'https://api.my-ip.io/ip',
  ];

  for (const service of services) {
    try {
      logger.debug(`Trying to get public IP from ${service}`);
      const response = await got(service, {
        timeout: { request: 5000 },
        retry: { limit: 0 },
      });
      const ip = response.body.trim();
      // Validate IP format (basic IPv4 check)
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        logger.info(`Public IP detected: ${ip}`);
        return ip;
      }
    } catch (error) {
      logger.debug(`Failed to get public IP from ${service}:`, error);
      continue;
    }
  }

  logger.error('Failed to get public IP from all services');
  console.log('⚠️  Could not detect public IP. Server will work on LAN.');
  return undefined;
}

/**
 * Setup UPnP port forwarding with retry logic
 */
async function setupUPnP(port: number, maxRetries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Attempting UPnP port mapping for port ${port} (attempt ${attempt}/${maxRetries})...`);
      const client = new NatAPI();

      // Create the mapping
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('UPnP mapping timed out after 10 seconds'));
        }, 10000);

        client.map(
          {
            publicPort: port,
            privatePort: port,
            protocol: 'TCP',
            description: 'LazyCraftLauncher Minecraft Server',
            ttl: 0,
          },
          (err: Error | null) => {
            clearTimeout(timeout);
            // Safely close client if method exists
            if (typeof client.close === 'function') {
              try {
                client.close();
              } catch (closeError) {
                logger.debug('Error closing UPnP client:', closeError);
              }
            }
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Verify the mapping was created
      logger.info('UPnP mapping created, verifying...');
      const verified = await verifyUPnPMapping(port);

      if (verified) {
        logger.info('UPnP port mapping successful and verified');
        console.log('✓ UPnP port forwarding enabled successfully!');
        return true;
      } else {
        logger.warn('UPnP mapping created but verification failed');
        if (attempt < maxRetries) {
          console.log(`UPnP verification failed, retrying (${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
          continue;
        }
      }
    } catch (error) {
      logger.error(`UPnP mapping attempt ${attempt} failed:`, error);
      if (attempt < maxRetries) {
        console.log(`UPnP failed, retrying (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
      }
    }
  }

  logger.error('UPnP mapping failed after all retries');
  console.log('⚠️  UPnP automatic port forwarding failed.');
  console.log('   Your router may not support UPnP or it may be disabled.');
  console.log('   Server will work on LAN. See connection info for manual setup.');
  return false;
}

/**
 * Verify UPnP mapping was successful
 */
async function verifyUPnPMapping(port: number): Promise<boolean> {
  try {
    const client = new NatAPI();
    const mappings = await new Promise<any[]>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('UPnP verification timed out'));
      }, 5000);

      client.getMappings((err: Error | null, results: any[]) => {
        clearTimeout(timeout);
        if (typeof client.close === 'function') {
          try {
            client.close();
          } catch (closeError) {
            logger.debug('Error closing UPnP client:', closeError);
          }
        }
        if (err) reject(err);
        else resolve(results || []);
      });
    });

    // Check if our port is in the mappings
    const found = mappings.some(m => m.public?.port === port || m.publicPort === port);
    return found;
  } catch (error) {
    logger.debug('UPnP verification failed:', error);
    return false; // If we can't verify, assume it worked (some routers don't support getMappings)
  }
}

/**
 * Setup firewall rules
 */
async function setupFirewall(
  port: number,
  osType: 'windows' | 'mac' | 'linux',
  javaPath?: string
): Promise<void> {
  try {
    switch (osType) {
      case 'windows':
        await setupWindowsFirewall(port);
        break;
      case 'mac':
        await setupMacFirewall(port, javaPath);
        break;
      case 'linux':
        await setupLinuxFirewall(port);
        break;
    }
  } catch (error) {
    logger.error('Firewall setup failed:', error);
    console.log('Could not automatically configure firewall.');
    showFirewallInstructions(port, osType, javaPath);
  }
}

/**
 * Setup Windows firewall
 */
async function setupWindowsFirewall(port: number): Promise<void> {
  logger.info('Setting up Windows firewall rule...');
  
  try {
    const elevated = await isElevated();
    if (!elevated) {
      console.log('\nAdministrator permissions required to add Windows firewall rules automatically.');
      console.log('Right-click the launcher and choose "Run as administrator", or apply the commands below manually:\n');
      showFirewallInstructions(port, 'windows');
      return;
    }

    await execa('netsh', getWindowsFirewallRemoveArgs(), { reject: false });
    await execa('netsh', getWindowsFirewallAddArgs(port));
    
    logger.info('Windows firewall rule added');
    console.log('Firewall rule added successfully');
  } catch (error) {
    throw new Error(`Windows firewall configuration failed: ${error}`);
  }
}

/**
 * Setup Mac firewall
 */
async function setupMacFirewall(port: number, javaPath?: string): Promise<void> {
  logger.info('Setting up Mac firewall rule...');

  try {
    // Determine the correct Java binary path
    // Fall back to system Java if not provided
    const javaBinary = javaPath || '/usr/bin/java';
    logger.info(`Using Java binary: ${javaBinary}`);

    // Check if firewall is even enabled
    const checkResult = await execa('sudo', [
      '/usr/libexec/ApplicationFirewall/socketfilterfw',
      '--getglobalstate',
    ], { reject: false, stdio: 'pipe' });

    if (checkResult.stdout.includes('disabled')) {
      logger.info('macOS firewall is disabled, skipping firewall configuration');
      console.log('ℹ️  macOS firewall is disabled. No firewall configuration needed.');
      return;
    }

    console.log('\n🔐 Sudo access required to configure firewall for port', port);
    console.log('Please enter your password when prompted:\n');

    // Get commands for the specific Java path
    const commands = getMacFirewallCommands(javaBinary);
    for (const args of commands) {
      // Use stdio: 'inherit' to allow sudo to interact with terminal directly
      await execa('sudo', args, { stdio: 'inherit' });
    }

    logger.info('Mac firewall rule added');
    console.log('\n✓ Firewall configured successfully!\n');
  } catch (error) {
    // If automation fails, provide manual instructions
    logger.error('Mac firewall setup failed:', error);
    console.log('\n⚠️  Automatic firewall setup failed.');
    console.log('The server will work on your local network without this.');
    console.log('For internet access from outside your network, follow these steps:\n');

    // Show detailed manual instructions with the actual Java path
    const manualSteps = getMacFirewallManualSteps(javaPath);
    manualSteps.forEach(step => console.log(step));
  }
}

/**
 * Setup Linux firewall
 */
async function setupLinuxFirewall(port: number): Promise<void> {
  logger.info('Setting up Linux firewall rule...');

  try {
    console.log('\nSudo access required to configure firewall for port', port);
    console.log('Please enter your password when prompted:\n');

    // Try iptables with inherited stdio for password prompt
    await execa('sudo', [
      'iptables',
      '-A', 'INPUT',
      '-p', 'tcp',
      '--dport', port.toString(),
      '-j', 'ACCEPT',
    ], { stdio: 'inherit' });

    logger.info('Linux firewall rule added');
    console.log('\nFirewall rule added successfully!\n');
  } catch (error) {
    // Try ufw as fallback
    try {
      await execa('sudo', [
        'ufw',
        'allow',
        `${port}/tcp`,
      ], { stdio: 'inherit' });

      logger.info('Linux firewall rule added via ufw');
      console.log('\nFirewall rule added successfully!\n');
    } catch {
      throw new Error(`Linux firewall configuration failed: ${error}`);
    }
  }
}

/**
 * Show manual firewall instructions
 */
function showFirewallInstructions(port: number, osType: string, javaPath?: string): void {
  console.log('\n');

  switch (osType) {
    case 'windows':
      getWindowsFirewallManualSteps(port).forEach(step => console.log(step));
      break;
    case 'mac':
      getMacFirewallManualSteps(javaPath).forEach(step => console.log(step));
      break;
    case 'linux':
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║     MANUAL LINUX FIREWALL CONFIGURATION                   ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log('');
      console.log('Run one of these commands to allow incoming connections:');
      console.log('');
      console.log('Option 1 - Using iptables:');
      console.log(`  sudo iptables -A INPUT -p tcp --dport ${port} -j ACCEPT`);
      console.log('');
      console.log('Option 2 - Using ufw (Ubuntu/Debian):');
      console.log(`  sudo ufw allow ${port}/tcp`);
      console.log('');
      console.log('Option 3 - Using firewalld (RHEL/CentOS/Fedora):');
      console.log(`  sudo firewall-cmd --permanent --add-port=${port}/tcp`);
      console.log('  sudo firewall-cmd --reload');
      console.log('');
      break;
  }

  console.log('');
}

/**
 * Test port reachability using multiple methods
 */
export async function testPortReachability(
  publicIP: string | undefined,
  port: number
): Promise<boolean> {
  if (!publicIP) {
    logger.warn('No public IP available for reachability test');
    return false;
  }

  logger.info(`Testing port ${port} reachability at ${publicIP}...`);

  // Method 1: Try direct TCP connection (most reliable but requires server to be running)
  const directTest = await testDirectConnection(publicIP, port);
  if (directTest) {
    logger.info(`Port ${port} is reachable via direct connection`);
    return true;
  }

  // Method 2: Try online port checker services
  const services = [
    {
      name: 'CanYouSeeMe',
      test: async () => {
        try {
          const response = await got(`https://canyouseeme.org/`, {
            timeout: { request: 10000 },
            responseType: 'text',
          });
          return response.body.toLowerCase().includes('success');
        } catch {
          return false;
        }
      }
    },
    {
      name: 'PortCheckTool',
      test: async () => {
        try {
          const response = await got(`https://www.portchecktool.com/`, {
            timeout: { request: 10000 },
            responseType: 'text',
          });
          return response.body.toLowerCase().includes('open');
        } catch {
          return false;
        }
      }
    },
  ];

  for (const service of services) {
    try {
      logger.debug(`Testing with ${service.name}`);
      const result = await service.test();
      if (result) {
        logger.info(`Port ${port} is reachable (verified by ${service.name})`);
        return true;
      }
    } catch (error) {
      logger.debug(`${service.name} test failed:`, error);
      continue;
    }
  }

  logger.info(`Port ${port} is not reachable from internet`);
  return false;
}

/**
 * Test direct TCP connection to the port
 */
async function testDirectConnection(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 5000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(true);
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });

    try {
      socket.connect(port, host);
    } catch {
      clearTimeout(timeout);
      resolve(false);
    }
  });
}

/**
 * Remove UPnP mapping
 */
export async function removeUPnP(port: number): Promise<void> {
  try {
    const client = new NatAPI();
    await new Promise<void>((resolve, reject) => {
      client.unmap(
        {
          publicPort: port,
          protocol: 'TCP',
        },
        (err: Error | null) => {
          // Safely close client if method exists
          if (typeof client.close === 'function') {
            try {
              client.close();
            } catch (closeError) {
              logger.debug('Error closing UPnP client:', closeError);
            }
          }
          if (err) reject(err);
          else resolve();
        }
      );
    });
    logger.info(`Removed UPnP mapping for port ${port}`);
  } catch (error) {
    logger.error('Failed to remove UPnP mapping:', error);
  }
}

/**
 * Remove firewall rule
 */
export async function removeFirewallRule(osType: string): Promise<void> {
  try {
    switch (osType) {
      case 'windows':
        if (await isElevated()) {
          await execa('netsh', getWindowsFirewallRemoveArgs(), { reject: false });
        }
        break;
      case 'mac':
        await execa('sudo', getMacFirewallRemoveCommand(), { reject: false });
        break;
    }
    logger.info('Firewall rule removed');
  } catch (error) {
    logger.error('Failed to remove firewall rule:', error);
  }
}

async function persistNetworkInfo(info: NetworkInfo): Promise<void> {
  try {
    const paths = getPaths();
    const infoPath = path.join(paths.root, '.network-info.json');
    await fs.writeJson(
      infoPath,
      {
        ...info,
        lastChecked: new Date().toISOString(),
      },
      { spaces: 2 }
    );
  } catch (error) {
    logger.warn('Failed to persist network info:', error);
  }
}
