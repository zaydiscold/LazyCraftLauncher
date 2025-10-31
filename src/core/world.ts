/**
 * World Management Module
 * Validates existing worlds, creates new ones
 */

import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/log.js';
import type { ValidationResult } from '../types/index.js';

/**
 * Validate an existing Minecraft world folder
 */
export async function validateWorld(worldPath: string): Promise<boolean> {
  const result = await validateWorldDetailed(worldPath);
  return result.valid;
}

/**
 * Detailed world validation
 */
export async function validateWorldDetailed(worldPath: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check if path exists
    if (!await fs.pathExists(worldPath)) {
      errors.push(`World folder does not exist: ${worldPath}`);
      return { valid: false, errors, warnings };
    }

    // Check if it's a directory
    const stats = await fs.stat(worldPath);
    if (!stats.isDirectory()) {
      errors.push(`Path is not a directory: ${worldPath}`);
      return { valid: false, errors, warnings };
    }

    // Check for essential files
    const levelDat = path.join(worldPath, 'level.dat');
    const regionDir = path.join(worldPath, 'region');

    if (!await fs.pathExists(levelDat)) {
      errors.push('Missing level.dat file');
    }

    if (!await fs.pathExists(regionDir)) {
      errors.push('Missing region/ directory');
    }

    // Check for region files
    if (await fs.pathExists(regionDir)) {
      const regionFiles = await fs.readdir(regionDir);
      const mcaFiles = regionFiles.filter(f => f.endsWith('.mca'));
      
      if (mcaFiles.length === 0) {
        warnings.push('No region files found (world may be empty)');
      }
    }

    // Optional checks for other world components
    const dataDirPath = path.join(worldPath, 'data');
    if (!await fs.pathExists(dataDirPath)) {
      warnings.push('Missing data/ directory (will be created on first run)');
    }

    const playerDataPath = path.join(worldPath, 'playerdata');
    if (!await fs.pathExists(playerDataPath)) {
      warnings.push('Missing playerdata/ directory (will be created when players join)');
    }

    // Check level.dat_old for backup
    const levelDatOld = path.join(worldPath, 'level.dat_old');
    if (!await fs.pathExists(levelDatOld)) {
      warnings.push('No level.dat_old backup found');
    }

    // Log findings
    if (errors.length > 0) {
      logger.error('World validation errors:', errors);
    }
    if (warnings.length > 0) {
      logger.warn('World validation warnings:', warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    logger.error('Error validating world:', error);
    errors.push(`Validation error: ${error}`);
    return { valid: false, errors, warnings };
  }
}

/**
 * Prepare world folder (create if new, validate if existing)
 */
export async function prepareWorld(worldPath: string, isNew: boolean): Promise<void> {
  if (isNew) {
    // For new worlds, just ensure the directory exists
    // The server will generate the world on first run
    await fs.ensureDir(worldPath);
    logger.info(`Created world directory: ${worldPath}`);
  } else {
    // Validate existing world
    const result = await validateWorldDetailed(worldPath);
    
    if (!result.valid) {
      const errorMsg = result.errors.join(', ');
      throw new Error(`Invalid world: ${errorMsg}`);
    }
    
    if (result.warnings.length > 0) {
      console.log('World validation warnings:', result.warnings.join(', '));
    }
    
    logger.info(`Validated existing world: ${worldPath}`);
  }
}

/**
 * Get world info (name, seed, etc.) if available
 */
export async function getWorldInfo(worldPath: string): Promise<any> {
  try {
    const levelDat = path.join(worldPath, 'level.dat');
    
    if (!await fs.pathExists(levelDat)) {
      return null;
    }

    // Note: Properly reading level.dat requires NBT parsing
    // For now, we'll just confirm it exists
    // In a production app, you'd use an NBT parser library
    
    return {
      path: worldPath,
      exists: true,
      // Additional NBT data would go here
    };
  } catch (error) {
    logger.error('Error reading world info:', error);
    return null;
  }
}

/**
 * Copy world to a new location
 */
export async function copyWorld(source: string, destination: string): Promise<void> {
  try {
    logger.info(`Copying world from ${source} to ${destination}`);
    await fs.copy(source, destination, {
      overwrite: false,
      errorOnExist: true,
    });
    logger.info('World copied successfully');
  } catch (error) {
    logger.error('Error copying world:', error);
    throw new Error(`Failed to copy world: ${error}`);
  }
}