/**
 * Backup Management Module
 * Creates and manages world backups
 */

import fs from 'fs-extra';
import path from 'path';
import AdmZip from 'adm-zip';
import { getPaths } from '../utils/paths.js';
import { logger } from '../utils/log.js';
import { formatBackupTimestamp, formatFileSize } from '../utils/date.js';
import { LIMITS } from '../utils/constants.js';
import type { BackupInfo } from '../types/index.js';

const MAX_BACKUPS = LIMITS.MAX_BACKUPS;

/**
 * Create a backup of the world
 */
export async function createBackup(worldPath: string): Promise<BackupInfo> {
  const paths = getPaths();
  const backupDir = paths.backups;
  
  await fs.ensureDir(backupDir);

  // Generate backup filename
  const timestamp = formatBackupTimestamp(new Date());
  const filename = `${timestamp}.zip`;
  const backupPath = path.join(backupDir, filename);
  
  logger.info(`Creating backup: ${filename}`);
  console.log('Creating backup... Saved your world. You\'re welcome.');
  
  try {
    // Create zip archive
    const zip = new AdmZip();
    
    // Add world folder
    if (await fs.pathExists(worldPath)) {
      await addFolderToZip(zip, worldPath, 'world');
    }
    
    // Add configuration files
    const configFiles = [
      'server.properties',
      '.lazycraft.yml',
      'eula.txt',
      'ops.json',
      'whitelist.json',
      'banned-players.json',
      'banned-ips.json',
    ];
    
    for (const file of configFiles) {
      const filePath = path.join(paths.root, file);
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath);
        zip.addFile(file, content);
      }
    }
    
    // Write zip file
    await new Promise<void>((resolve, reject) => {
      zip.writeZip(backupPath, (error: Error | null) => {
        if (error) reject(error);
        else resolve();
      });
    });
    
    // Get file stats
    const stats = await fs.stat(backupPath);
    
    // Clean old backups
    await cleanOldBackups(backupDir, MAX_BACKUPS);
    
    const backupInfo: BackupInfo = {
      filename,
      path: backupPath,
      size: stats.size,
      createdAt: new Date(),
    };
    
    logger.info(`Backup created successfully: ${filename} (${formatFileSize(stats.size)})`);
    
    return backupInfo;
  } catch (error) {
    logger.error('Error creating backup:', error);
    throw new Error(`Failed to create backup: ${error}`);
  }
}

/**
 * Add folder to zip recursively
 */
async function addFolderToZip(
  zip: AdmZip,
  folderPath: string,
  zipPath: string
): Promise<void> {
  const items = await fs.readdir(folderPath);
  
  for (const item of items) {
    const itemPath = path.join(folderPath, item);
    const itemZipPath = path.join(zipPath, item);
    const stats = await fs.stat(itemPath);
    
    if (stats.isDirectory()) {
      // Recursively add subdirectory
      await addFolderToZip(zip, itemPath, itemZipPath);
    } else {
      // Add file
      const content = await fs.readFile(itemPath);
      zip.addFile(itemZipPath, content);
    }
  }
}

/**
 * Clean old backups (keep only the most recent N)
 */
async function cleanOldBackups(backupDir: string, maxBackups: number): Promise<void> {
  try {
    const files = await fs.readdir(backupDir);
    const backups = files
      .filter(f => f.endsWith('.zip'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
      }));
    
    // Sort by name (timestamp) descending
    backups.sort((a, b) => b.name.localeCompare(a.name));
    
    // Remove old backups
    if (backups.length > maxBackups) {
      const toRemove = backups.slice(maxBackups);
      
      for (const backup of toRemove) {
        await fs.remove(backup.path);
        logger.info(`Removed old backup: ${backup.name}`);
      }
    }
  } catch (error) {
    logger.error('Error cleaning old backups:', error);
  }
}

/**
 * List available backups
 */
export async function listBackups(): Promise<BackupInfo[]> {
  const paths = getPaths();
  const backupDir = paths.backups;
  
  if (!await fs.pathExists(backupDir)) {
    return [];
  }
  
  const files = await fs.readdir(backupDir);
  const backups: BackupInfo[] = [];
  
  for (const file of files) {
    if (!file.endsWith('.zip')) continue;
    
    const backupPath = path.join(backupDir, file);
    const stats = await fs.stat(backupPath);
    
    backups.push({
      filename: file,
      path: backupPath,
      size: stats.size,
      createdAt: stats.birthtime,
    });
  }
  
  // Sort by date descending
  backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  return backups;
}

/**
 * Restore from backup
 */
export async function restoreBackup(backupPath: string, worldPath: string): Promise<void> {
  logger.info(`Restoring backup from ${backupPath}`);
  
  try {
    // Verify backup exists
    if (!await fs.pathExists(backupPath)) {
      throw new Error('Backup file not found');
    }
    
    // Create temporary extraction directory
    const paths = getPaths();
    const tempDir = path.join(paths.temp, 'restore-' + Date.now());
    await fs.ensureDir(tempDir);
    
    // Extract backup
    const zip = new AdmZip(backupPath);
    zip.extractAllTo(tempDir, true);
    
    // Backup current world if it exists
    if (await fs.pathExists(worldPath)) {
      const backupName = `pre-restore-${formatBackupTimestamp(new Date())}`;
      const currentBackup = path.join(worldPath + '-' + backupName);
      await fs.move(worldPath, currentBackup);
      logger.info(`Backed up current world to ${currentBackup}`);
    }
    
    // Restore world folder
    const extractedWorld = path.join(tempDir, 'world');
    if (await fs.pathExists(extractedWorld)) {
      await fs.move(extractedWorld, worldPath);
      logger.info('World restored successfully');
    }
    
    // Restore config files
    const configFiles = await fs.readdir(tempDir);
    for (const file of configFiles) {
      if (file !== 'world') {
        const source = path.join(tempDir, file);
        const dest = path.join(paths.root, file);
        await fs.copy(source, dest, { overwrite: true });
        logger.info(`Restored config file: ${file}`);
      }
    }
    
    // Clean up temp directory
    await fs.remove(tempDir);
    
    logger.info('Backup restored successfully');
  } catch (error) {
    logger.error('Error restoring backup:', error);
    throw new Error(`Failed to restore backup: ${error}`);
  }
}

/**
 * Get backup retention policy
 */
export function getBackupPolicy(): {
  maxBackups: number;
  autoBackup: boolean;
} {
  return {
    maxBackups: MAX_BACKUPS,
    autoBackup: true,
  };
}