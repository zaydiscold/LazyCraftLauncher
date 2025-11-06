/**
 * Shared application types
 */

export type SupportedOS = 'windows' | 'mac' | 'linux';

export type ServerType = 'vanilla' | 'forge';

export interface LazyConfig {
  version: string;
  serverType: ServerType;
  minecraftVersion: string;
  worldPath: string;
  isNewWorld: boolean;
  port: number;
  ramGB: number;
  profile: 'survival-default' | 'creative-flat' | 'hardcore-minimal' | string;
  upnpEnabled: boolean;
  backupOnExit: boolean;
  lastRun: string;
  javaPath?: string;
  eulaAccepted?: boolean;
  serverJarVersion?: string;
  serverJarType?: ServerType;
}

export interface SystemInfo {
  os: SupportedOS;
  platform: NodeJS.Platform;
  arch: string;
  totalRAMGB: number;
  availableRAMGB: number;
  javaInstalled: boolean;
  javaVersion?: string;
  javaPath?: string;
}

export interface NetworkInfo {
  lanIP: string;
  publicIP?: string;
  port: number;
  upnpSuccess: boolean;
  reachable: boolean;
  lastChecked?: string;
}

export interface ServerStatus {
  running: boolean;
  uptime: number;
  playersOnline: number;
  maxPlayers: number;
  version?: string;
  port: number;
  memoryUsageMB?: number;
  reachable: boolean;
  statusMessage?: string;
  lastLogLine?: string;
}

export interface WizardAnswers {
  mode?: 'quick' | 'advanced';
  serverType?: ServerType;
  minecraftVersion?: string;
  worldChoice?: 'new' | 'existing';
  worldPath?: string;
  ramGB?: number;
  port?: number;
  profile?: LazyConfig['profile'];
  upnp?: boolean;
  backup?: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type ActionStatus = 'pending' | 'failed' | 'completed';

export interface ActionResult {
  operationId: string;
  status: ActionStatus;
  message: string;
}

export interface BackupInfo {
  filename: string;
  path: string;
  size: number;
  createdAt: Date;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
