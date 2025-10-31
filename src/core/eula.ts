/**
 * EULA Management Module
 * Handles Minecraft EULA acceptance
 */

import fs from 'fs-extra';
import path from 'path';
import { getPaths } from '../utils/paths.js';
import { logger } from '../utils/log.js';

const EULA_URL = 'https://www.minecraft.net/eula';

/**
 * Accept the Minecraft EULA
 */
export async function acceptEULA(): Promise<void> {
  const paths = getPaths();
  const eulaPath = path.join(paths.root, 'eula.txt');
  
  // Check if EULA is already accepted
  if (await isEULAAccepted(eulaPath)) {
    logger.info('EULA already accepted');
    return;
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('EULA TIME. You never read these. I did for you.');
  console.log(`\nMinecraft EULA: ${EULA_URL}`);
  console.log('\nBy continuing, you agree to the Minecraft EULA.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Auto-accept EULA
  await writeEULA(eulaPath, true);
  
  logger.info(`EULA accepted at ${new Date().toISOString()}`);
  console.log('EULA accepted. Moving on.');
}

/**
 * Check if EULA is already accepted
 */
async function isEULAAccepted(eulaPath: string): Promise<boolean> {
  try {
    if (!await fs.pathExists(eulaPath)) {
      return false;
    }
    
    const content = await fs.readFile(eulaPath, 'utf-8');
    return content.includes('eula=true');
  } catch (error) {
    logger.error('Error checking EULA:', error);
    return false;
  }
}

/**
 * Write EULA file
 */
async function writeEULA(eulaPath: string, accepted: boolean): Promise<void> {
  const content = [
    '#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://www.minecraft.net/eula).',
    `#${new Date().toISOString()}`,
    `eula=${accepted}`,
  ].join('\n');
  
  await fs.writeFile(eulaPath, content, 'utf-8');
}

/**
 * Get EULA status
 */
export async function getEULAStatus(): Promise<{
  accepted: boolean;
  path: string;
  url: string;
}> {
  const paths = getPaths();
  const eulaPath = path.join(paths.root, 'eula.txt');
  const accepted = await isEULAAccepted(eulaPath);
  
  return {
    accepted,
    path: eulaPath,
    url: EULA_URL,
  };
}

/**
 * Revoke EULA acceptance (for testing)
 */
export async function revokeEULA(): Promise<void> {
  const paths = getPaths();
  const eulaPath = path.join(paths.root, 'eula.txt');
  
  if (await fs.pathExists(eulaPath)) {
    await writeEULA(eulaPath, false);
    logger.info('EULA acceptance revoked');
  }
}