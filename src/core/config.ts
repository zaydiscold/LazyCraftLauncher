/**
 * Configuration Management Module
 * Handles .lazycraft.yml config file
 */

import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import { getPaths } from '../utils/paths.js';
import { logger } from '../utils/log.js';
import type { LazyConfig } from '../types/index.js';

const CONFIG_FILE = '.lazycraft.yml';

/**
 * Load configuration from file
 */
export async function loadConfig(): Promise<LazyConfig | null> {
  try {
    const paths = getPaths();
    const configPath = path.join(paths.root, CONFIG_FILE);
    
    if (!await fs.pathExists(configPath)) {
      logger.info('No saved configuration found');
      return null;
    }

    const content = await fs.readFile(configPath, 'utf-8');
    const config = yaml.parse(content) as LazyConfig;
    
    logger.info('Loaded configuration from', CONFIG_FILE);
    return config;
  } catch (error) {
    logger.error('Error loading config:', error);
    return null;
  }
}

/**
 * Save configuration to file
 */
export async function saveConfig(config: LazyConfig): Promise<void> {
  try {
    const paths = getPaths();
    const configPath = path.join(paths.root, CONFIG_FILE);
    
    // Update last run time
    config.lastRun = new Date().toISOString();
    
    const content = yaml.stringify(config, {
      indent: 2,
      lineWidth: 0, // Disable line wrapping
    });
    
    await fs.writeFile(configPath, content, 'utf-8');
    logger.info('Saved configuration to', CONFIG_FILE);
  } catch (error) {
    logger.error('Error saving config:', error);
    throw new Error(`Failed to save configuration: ${error}`);
  }
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): LazyConfig {
  return {
    version: '1.0.0',
    serverType: 'vanilla',
    minecraftVersion: 'latest',
    worldPath: './world',
    isNewWorld: true,
    port: 25565,
    ramGB: 2,
    profile: 'survival-default',
    upnpEnabled: true,
    backupOnExit: true,
    lastRun: new Date().toISOString(),
  };
}

/**
 * Merge configurations (saved config + new answers)
 */
export function mergeConfig(saved: LazyConfig | null, updates: Partial<LazyConfig>): LazyConfig {
  const base = saved || getDefaultConfig();
  return {
    ...base,
    ...updates,
    lastRun: new Date().toISOString(),
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: LazyConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.serverType) {
    errors.push('Server type is required');
  }

  if (config.port < 1024 || config.port > 65535) {
    errors.push('Port must be between 1024 and 65535');
  }

  if (config.ramGB < 1 || config.ramGB > 128) {
    errors.push('RAM must be between 1 and 128 GB');
  }

  if (!config.worldPath) {
    errors.push('World path is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}