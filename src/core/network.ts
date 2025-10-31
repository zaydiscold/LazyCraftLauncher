/**
 * Network Configuration Module
 * Handles UPnP, firewall, port testing
 */

import os from 'os';
import got from 'got';
import { Client as NatClient } from 'nat-api';
import { execa } from 'execa';
import { logger } from '../utils/log.js';
import { getLocalIP } from './detect.js';
import type { NetworkInfo } from '../types/index.js';

/**
 * Setup network configuration
 */
export async function setupNetwork(
  port: number,
  osType: 'windows' | 'mac' | 'linux'
): Promise<NetworkInfo> {
  logger.info('Setting up network configuration...');
  
  // Get local IP
  const lanIP = getLocalIP();
  
  // Get public IP
  const publicIP = await getPublicIP();
  
  // Setup UPnP
  const upnpSuccess = await setupUPnP(port);
  
  // Setup firewall
  await setupFirewall(port, osType);
  
  // Test reachability (after server starts)
  // Initial status - will be updated after server starts
  const networkInfo: NetworkInfo = {
    lanIP,
    publicIP,
    port,
    upnpSuccess,
    reachable: false,
  };
  
  return networkInfo;
}

/**
 * Get public IP address
 */
async function getPublicIP(): Promise<string | undefined> {
  try {
    const response = await got('https://api.ipify.org', {
      timeout: { request: 5000 },
    });
    return response.body.trim();
  } catch (error) {
    logger.error('Failed to get public IP:', error);
    return undefined;
  }
}

/**
 * Setup UPnP port forwarding
 */
async function setupUPnP(port: number): Promise<boolean> {
  try {
    logger.info(`Attempting UPnP port mapping for port ${port}...`);
    
    const client = new NatClient();
    
    await client.map({
      publicPort: port,
      privatePort: port,
      protocol: 'TCP',
      description: 'LazyCraftLauncher Minecraft Server',
      ttl: 0, // Permanent mapping
    });
    
    logger.info('UPnP port mapping successful');
    console.log('UPnP enabled successfully!');
    return true;
  } catch (error) {
    logger.error('UPnP mapping failed:', error);
    console.log('UPnP failed. Your router said no. You still get LAN.');
    return false;
  }
}

/**
 * Setup firewall rules
 */
async function setupFirewall(
  port: number,
  osType: 'windows' | 'mac' | 'linux'
): Promise<void> {
  try {
    switch (osType) {
      case 'windows':
        await setupWindowsFirewall(port);
        break;
      case 'mac':
        await setupMacFirewall(port);
        break;
      case 'linux':
        await setupLinuxFirewall(port);
        break;
    }
  } catch (error) {
    logger.error('Firewall setup failed:', error);
    console.log('Could not automatically configure firewall.');
    showFirewallInstructions(port, osType);
  }
}

/**
 * Setup Windows firewall
 */
async function setupWindowsFirewall(port: number): Promise<void> {
  logger.info('Setting up Windows firewall rule...');
  
  try {
    // Remove existing rule if present
    await execa('netsh', [
      'advfirewall', 'firewall', 'delete', 'rule',
      'name="LazyCraftLauncher"'
    ], { reject: false });
    
    // Add new rule
    await execa('netsh', [
      'advfirewall', 'firewall', 'add', 'rule',
      'name="LazyCraftLauncher"',
      'dir=in',
      'action=allow',
      'protocol=TCP',
      `localport=${port}`,
    ]);
    
    logger.info('Windows firewall rule added');
    console.log('Firewall rule added successfully');
  } catch (error) {
    throw new Error(`Windows firewall configuration failed: ${error}`);
  }
}

/**
 * Setup Mac firewall
 */
async function setupMacFirewall(port: number): Promise<void> {
  logger.info('Setting up Mac firewall rule...');
  
  try {
    console.log('Need sudo to add firewall rule. Don\'t worry, it\'s just for port', port);
    
    // Try to add Java to firewall exceptions
    await execa('sudo', [
      '/usr/libexec/ApplicationFirewall/socketfilterfw',
      '--add',
      '/usr/bin/java',
    ]);
    
    // Unblock Java
    await execa('sudo', [
      '/usr/libexec/ApplicationFirewall/socketfilterfw',
      '--unblock',
      '/usr/bin/java',
    ]);
    
    logger.info('Mac firewall rule added');
    console.log('Firewall configured successfully');
  } catch (error) {
    // If automation fails (likely due to SIP or no sudo), provide manual instructions
    throw new Error(`Mac firewall configuration failed: ${error}`);
  }
}

/**
 * Setup Linux firewall
 */
async function setupLinuxFirewall(port: number): Promise<void> {
  logger.info('Setting up Linux firewall rule...');
  
  try {
    // Try iptables
    await execa('sudo', [
      'iptables',
      '-A', 'INPUT',
      '-p', 'tcp',
      '--dport', port.toString(),
      '-j', 'ACCEPT',
    ]);
    
    logger.info('Linux firewall rule added');
    console.log('Firewall rule added successfully');
  } catch (error) {
    // Try ufw as fallback
    try {
      await execa('sudo', [
        'ufw',
        'allow',
        `${port}/tcp`,
      ]);
      
      logger.info('Linux firewall rule added via ufw');
      console.log('Firewall rule added successfully');
    } catch {
      throw new Error(`Linux firewall configuration failed: ${error}`);
    }
  }
}

/**
 * Show manual firewall instructions
 */
function showFirewallInstructions(port: number, osType: string): void {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('MANUAL FIREWALL CONFIGURATION NEEDED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  switch (osType) {
    case 'windows':
      console.log('Run as Administrator:');
      console.log(`netsh advfirewall firewall add rule name="LazyCraftLauncher" dir=in action=allow protocol=TCP localport=${port}`);
      break;
    case 'mac':
      console.log('1. Open System Preferences > Security & Privacy > Firewall');
      console.log('2. Click the lock and enter your password');
      console.log('3. Click "Firewall Options"');
      console.log('4. Click "+" and add Java');
      console.log('5. Set to "Allow incoming connections"');
      break;
    case 'linux':
      console.log('Run one of these commands:');
      console.log(`sudo iptables -A INPUT -p tcp --dport ${port} -j ACCEPT`);
      console.log('OR');
      console.log(`sudo ufw allow ${port}/tcp`);
      break;
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Test port reachability
 */
export async function testPortReachability(
  publicIP: string | undefined,
  port: number
): Promise<boolean> {
  if (!publicIP) {
    return false;
  }
  
  try {
    logger.info(`Testing port ${port} reachability...`);
    
    // Use portchecker.io API
    const response = await got(`https://portchecker.io/check`, {
      searchParams: {
        host: publicIP,
        port: port.toString(),
      },
      timeout: { request: 10000 },
      responseType: 'text',
    });
    
    const isOpen = response.body.toLowerCase().includes('open') || 
                   response.body.toLowerCase().includes('reachable');
    
    logger.info(`Port ${port} is ${isOpen ? 'reachable' : 'not reachable'}`);
    return isOpen;
  } catch (error) {
    logger.error('Port reachability test failed:', error);
    return false;
  }
}

/**
 * Remove UPnP mapping
 */
export async function removeUPnP(port: number): Promise<void> {
  try {
    const client = new NatClient();
    await client.unmap({
      publicPort: port,
      protocol: 'TCP',
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
        await execa('netsh', [
          'advfirewall', 'firewall', 'delete', 'rule',
          'name="LazyCraftLauncher"'
        ], { reject: false });
        break;
      case 'mac':
        await execa('sudo', [
          '/usr/libexec/ApplicationFirewall/socketfilterfw',
          '--remove',
          '/usr/bin/java',
        ], { reject: false });
        break;
    }
    logger.info('Firewall rule removed');
  } catch (error) {
    logger.error('Failed to remove firewall rule:', error);
  }
}