/**
 * Application Constants
 * Centralized configuration values and magic numbers
 */

/**
 * Timeout values in milliseconds
 */
export const TIMEOUTS = {
  /** UPnP port mapping timeout */
  UPNP_MAPPING: 10_000,
  /** UPnP mapping verification timeout */
  UPNP_VERIFICATION: 5_000,
  /** Maximum time to wait for graceful server shutdown */
  GRACEFUL_SHUTDOWN: 30_000,
  /** Delay between server stop and restart */
  SERVER_RESTART_DELAY: 2_000,
  /** HTTP API request timeout */
  API_REQUEST: 30_000,
  /** Port reachability test timeout */
  PORT_REACHABILITY: 5_000,
  /** Direct TCP connection test timeout */
  DIRECT_CONNECTION_TEST: 5_000,
  /** Public IP detection timeout */
  PUBLIC_IP_TIMEOUT: 5_000,
  /** Process kill check delay */
  PROCESS_KILL_CHECK: 1_000,
  /** Force kill retry delay */
  FORCE_KILL_RETRY: 500,
  /** Server ready check delay */
  SERVER_READY_CHECK: 5_000,
  /** UPnP retry delay */
  UPNP_RETRY_DELAY: 2_000,
  /** Windows elevation check timeout */
  ELEVATION_CHECK_TIMEOUT: 5_000,
} as const;

/**
 * Application limits and constraints
 */
export const LIMITS = {
  /** Maximum number of backups to retain */
  MAX_BACKUPS: 7,
  /** API server port */
  API_PORT: 8765,
  /** API server host (localhost only) */
  API_HOST: '127.0.0.1',
  /** Default Minecraft server port */
  DEFAULT_MINECRAFT_PORT: 25565,
  /** Default RCON port */
  DEFAULT_RCON_PORT: 25575,
  /** Minimum allowed port number */
  MIN_PORT: 1024,
  /** Maximum allowed port number */
  MAX_PORT: 65535,
  /** Minimum RAM allocation (GB) */
  MIN_RAM_GB: 1,
  /** Maximum RAM allocation (GB) */
  MAX_RAM_GB: 128,
  /** Maximum UPnP retry attempts */
  MAX_UPNP_RETRIES: 3,
  /** Maximum lines to parse from log file for player state */
  MAX_LOG_LINES_TO_PARSE: 500,
} as const;

/**
 * External API endpoints
 */
export const APIS = {
  /** Mojang version manifest */
  VERSION_MANIFEST: 'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json',
  /** Forge promotions */
  FORGE_PROMOTIONS: 'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json',
  /** Forge Maven repository */
  FORGE_MAVEN: 'https://maven.minecraftforge.net/net/minecraftforge/forge',
  /** Adoptium JRE API */
  ADOPTIUM_API: 'https://api.adoptium.net/v3',
  /** Public IP detection services (with fallbacks) */
  PUBLIC_IP_SERVICES: [
    'https://api.ipify.org',
    'https://icanhazip.com',
    'https://ifconfig.me/ip',
    'https://api.my-ip.io/ip',
  ],
} as const;

/**
 * File and directory names
 */
export const FILES = {
  /** Main configuration file */
  CONFIG: '.lazycraft.yml',
  /** Server JAR file */
  SERVER_JAR: 'server.jar',
  /** Server PID file */
  PID_FILE: '.server.pid',
  /** Network info cache */
  NETWORK_INFO: '.network-info.json',
  /** Server metadata */
  SERVER_METADATA: '.server-metadata.json',
  /** EULA acceptance file */
  EULA: 'eula.txt',
  /** Server properties */
  SERVER_PROPERTIES: 'server.properties',
  /** Latest server log */
  LATEST_LOG: 'logs/latest.log',
} as const;

/**
 * Directory names
 */
export const DIRECTORIES = {
  /** Log files directory */
  LOGS: 'logs',
  /** Backup files directory */
  BACKUPS: 'backups',
  /** Temporary files directory */
  TEMP: '.temp',
  /** Downloaded JRE directory */
  JRE: 'jre',
  /** Cache directory */
  CACHE: '.cache',
  /** Configuration templates directory */
  TEMPLATES: 'templates',
  /** Profile templates directory */
  PROFILES: 'templates/profiles',
} as const;

/**
 * Configuration defaults
 */
export const DEFAULTS = {
  /** Default config version */
  CONFIG_VERSION: '1.0.0',
  /** Default server type */
  SERVER_TYPE: 'vanilla' as const,
  /** Default Minecraft version */
  MINECRAFT_VERSION: 'latest',
  /** Default world path */
  WORLD_PATH: './world',
  /** Default server port */
  PORT: 25565,
  /** Default RAM allocation (GB) */
  RAM_GB: 2,
  /** Default game profile */
  PROFILE: 'survival-default',
  /** Default max players */
  MAX_PLAYERS: 20,
  /** Enable UPnP by default */
  UPNP_ENABLED: true,
  /** Enable backup on exit by default */
  BACKUP_ON_EXIT: true,
} as const;

/**
 * Java requirements
 */
export const JAVA = {
  /** Minimum required Java version */
  MIN_VERSION: 17,
  /** Recommended Java version */
  RECOMMENDED_VERSION: 21,
  /** Java executable name on Windows */
  WINDOWS_EXE: 'java.exe',
  /** Java executable name on Unix */
  UNIX_EXE: 'java',
} as const;

/**
 * Regular expressions for parsing
 */
export const REGEX = {
  /** IPv4 address validation */
  IPV4: /^(\d{1,3}\.){3}\d{1,3}$/,
  /** Java version extraction */
  JAVA_VERSION: /version "(.+?)"/,
  /** Player joined message */
  PLAYER_JOINED: /\]: (.+?) joined the game/,
  /** Player left message */
  PLAYER_LEFT: /\]: (.+?) left the game/,
  /** Server ready message */
  SERVER_READY: /Done.*For help, type/,
} as const;

/**
 * User-facing messages
 */
export const MESSAGES = {
  /** Application banner lines */
  BANNER: [
    '╔══════════════════════════════════════╗',
    '║                                      ║',
    '║      LAZY CRAFT LAUNCHER             ║',
    '║                                      ║',
    '║   "You ask to play, we host for you."║',
    '║                                      ║',
    '╚══════════════════════════════════════╝',
  ],
} as const;
