# LazyCraftLauncher - Technical Documentation

This document provides comprehensive technical documentation for the LazyCraftLauncher codebase, explaining the architecture, how each component works, the data flow, and implementation details.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Application Entry Points](#application-entry-points)
4. [Core Systems](#core-systems)
5. [User Interface Components](#user-interface-components)
6. [Platform-Specific Implementations](#platform-specific-implementations)
7. [Utility Systems](#utility-systems)
8. [Data Flow and Lifecycles](#data-flow-and-lifecycles)
9. [Configuration and State Management](#configuration-and-state-management)
10. [Network Architecture](#network-architecture)
11. [Server Management](#server-management)
12. [Type System](#type-system)

---

## Project Overview

**LazyCraftLauncher** is a sophisticated Terminal User Interface (TUI) application built on Node.js that completely automates the setup, configuration, and management of Minecraft multiplayer servers. The project eliminates technical barriers by handling every aspect of server hosting—from Java runtime installation to network configuration to automated backups.

### Core Philosophy

The launcher is built around the principle of **zero-configuration automation with graceful degradation**. Every technical task is automated, but when automation fails (due to permissions, network restrictions, or platform limitations), the system provides clear, actionable manual instructions rather than failing silently.

### Design Principles

1. **Automation First**: Every manual step in traditional server setup is automated
2. **Graceful Degradation**: Failures result in helpful instructions, not crashes
3. **Cross-Platform Consistency**: Same experience on Windows, macOS, and Linux
4. **User-Friendly Feedback**: Snarky, personality-driven messages keep users informed
5. **Stateful Persistence**: All configurations saved for quick re-launches
6. **External Integration**: REST API enables third-party tools and automation

---

## Architecture

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  main.ts     │  │  cli.tsx     │  │  API Server  │          │
│  │  (Entry)     │──│  (React App) │  │  (Express)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼─────────────────────────────────────┐
│                    User Interface Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Wizard.tsx   │  │Dashboard.tsx │  │ Components   │           │
│  │ (Setup)      │  │ (Monitoring) │  │ (UI Panels)  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼─────────────────────────────────────┐
│                    Core Business Logic Layer                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ backup  │ │ config  │ │ network │ │  world  │ │   run   │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  java   │ │downloads│ │serverJar│ │  eula   │ │ status  │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                            │
│  │  props  │ │   qr    │ │ report  │                            │
│  └─────────┘ └─────────┘ └─────────┘                            │
└────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼─────────────────────────────────────┐
│                    Platform & Utility Layer                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ detect  │ │  paths  │ │   log   │ │  exec   │ │ windows │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│  ┌─────────┐                                                      │
│  │   mac   │                                                      │
│  └─────────┘                                                      │
└────────────────────────────────────────────────────────────────────┘
```

---

## Application Entry Points

### `main.ts` - Application Bootstrap

The main entry point handles initialization, argument parsing, and application mode selection.

**Initialization Sequence**:

1. **Directory Setup**: Creates essential directories (`logs/`, `backups/`, `temp/`)
2. **Argument Parsing**: Processes command-line flags
3. **API Server Launch**: Starts REST API server on port 8765
4. **React App Render**: Launches Ink-based TUI

**Command-Line Modes**:

```typescript
// Standard interactive mode
lazycraft

// Quick launch with saved configuration
lazycraft --quick

// API-only mode (no UI)
lazycraft --api-only

// Help display
lazycraft --help
```

**Error Handling**:
- Global `uncaughtException` and `unhandledRejection` handlers
- All errors logged to file and displayed to user
- Graceful shutdown on critical failures

**Key Responsibilities**:
- Process lifecycle management
- Directory structure initialization
- API server coordination with UI
- Signal handling (SIGINT, SIGTERM)

---

### `cli.tsx` - React Application Root

The main React component orchestrating the entire TUI experience using Ink.

**State Machine**:

```
     ┌──────────┐
     │ loading  │  (Initial state)
     └────┬─────┘
          │
          ├─────────► error (Fatal failure)
          │
          ▼
     ┌──────────┐
     │  wizard  │  (Configuration collection)
     └────┬─────┘
          │
          ▼
     ┌──────────┐
     │  setup   │  (Server installation & config)
     └────┬─────┘
          │
          ▼
     ┌──────────┐
     │dashboard │  (Live monitoring & control)
     └──────────┘
```

**State Management**:
- `config`: Current launcher configuration (`LazyConfig`)
- `systemInfo`: Detected system capabilities (`SystemInfo`)
- `networkInfo`: Network setup results (`NetworkInfo`)
- `serverProcess`: Running Minecraft server process
- `error`: Error message if state = 'error'
- `setupProgress`: Current setup step for user feedback

**Key Functions**:

```typescript
async function initialize()
```
- Displays ASCII art banner with gradient
- Detects system information (OS, RAM, CPU)
- Loads saved configuration from `.lazycraft.yml`
- Decides between Quick Launch and Wizard modes

```typescript
async function runSetup(config: LazyConfig, systemInfo: SystemInfo)
```
- Orchestrates the complete setup sequence:
  1. **Java Setup**: Ensures Java 17/21 installed or downloads Temurin JRE
  2. **Server JAR**: Downloads/installs Vanilla or Forge server
  3. **EULA**: Displays and accepts Mojang EULA
  4. **Network**: Configures UPnP, firewall, tests reachability
  5. **Server Start**: Launches Minecraft server process
  6. **Report**: Generates setup summary report
  7. **Config Save**: Persists configuration for future quick launches

```typescript
async function handleWizardComplete(answers: WizardAnswers)
```
- Converts wizard answers to `LazyConfig` object
- Validates all inputs
- Initiates setup sequence

```typescript
async function handleStop()
```
- Creates backup if `backupOnExit` enabled
- Gracefully stops server process
- Cleans up resources
- Exits application

---

## Core Systems

### Backup System (`backup.ts`)

Manages automatic and manual backups with intelligent retention policies.

**Backup Creation Process**:

```typescript
async function createBackup(worldPath: string): Promise<BackupInfo>
```

1. **Archive Creation**: Creates ZIP file with timestamp name (`YYYYMMDD-HHMM.zip`)
2. **World Inclusion**: Recursively adds entire `world/` folder
3. **Config Inclusion**: Adds configuration files:
   - `server.properties`
   - `.lazycraft.yml`
   - `eula.txt`
   - `ops.json`, `whitelist.json`
   - `banned-players.json`, `banned-ips.json`
4. **Retention Management**: Automatically deletes backups older than the 7 most recent
5. **Metadata**: Returns `BackupInfo` with size, path, creation timestamp

**Retention Policy**:
- Maximum 7 backups retained
- Oldest backups deleted first
- Backup names sorted lexicographically (timestamp-based)
- No size limits (all backups kept until count exceeds 7)

**Backup Restoration**:

```typescript
async function restoreBackup(backupPath: string, worldPath: string)
```

1. **Current World Backup**: Backs up existing world before overwriting
2. **Extraction**: Unzips backup to temporary directory
3. **World Replacement**: Moves extracted world to active location
4. **Config Restoration**: Restores configuration files
5. **Cleanup**: Removes temporary extraction directory

**User-Facing Messages**:
- "Creating backup... Saved your world. You're welcome."
- Confirms backup size and location

---

### Configuration System (`config.ts`)

Handles YAML-based configuration persistence and validation.

**Configuration Schema**:

```yaml
version: 1.0.0                    # Config format version
serverType: vanilla               # vanilla | forge | fabric | paper
minecraftVersion: latest          # Version string or "latest"
worldPath: ./world                # Path to world folder
isNewWorld: true                  # Create new vs. use existing
port: 25565                       # Server port (1024-65535)
ramGB: 4                          # RAM allocation in GB
profile: survival-default         # Game profile preset
upnpEnabled: true                 # Attempt UPnP port forwarding
backupOnExit: true                # Auto-backup on shutdown
javaPath: ./jre/bin/java          # Path to Java executable
eulaAccepted: true                # EULA consent flag
lastRun: 2025-11-05T12:34:56Z     # ISO 8601 timestamp
```

**Key Functions**:

```typescript
async function loadConfig(): Promise<LazyConfig | null>
```
- Reads `.lazycraft.yml` from working directory
- Parses YAML to TypeScript object
- Returns `null` if file doesn't exist (first run)
- Validates schema and migrates old versions

```typescript
async function saveConfig(config: LazyConfig): Promise<void>
```
- Updates `lastRun` timestamp
- Serializes to YAML with pretty formatting
- Writes atomically to prevent corruption
- Creates backup of previous config

```typescript
function validateConfig(config: LazyConfig): ValidationResult
```
- **Server Type**: Must be valid type (vanilla/forge/fabric/paper)
- **Port**: Range check (1024-65535), not privileged ports
- **RAM**: Range check (1-128 GB), compare against system RAM
- **World Path**: Must be non-empty, valid path
- Returns validation result with specific error messages

**Default Configuration**:
- Server: Vanilla, latest version
- RAM: 2GB (conservative default)
- Port: 25565 (Minecraft standard)
- Profile: Survival Default
- UPnP: Enabled
- Backup on exit: Enabled

---

### Network Configuration System (`network.ts`)

Handles all networking aspects: IP detection, UPnP, firewall configuration, and reachability testing.

**Network Setup Workflow**:

```typescript
async function setupNetwork(port: number, osType: string): Promise<NetworkInfo>
```

1. **LAN IP Detection**: Identifies local network IP address
2. **Public IP Discovery**: Queries `https://api.ipify.org` for WAN IP
3. **UPnP Port Mapping**: Attempts automatic router configuration
4. **Firewall Configuration**: Adds OS-specific firewall rules
5. **Reachability Test**: Tests port accessibility from internet

**UPnP Implementation**:

```typescript
async function setupUPnP(port: number): Promise<boolean>
```

Uses `nat-api` library to discover router and create port mapping:
- Protocol: TCP
- Public Port: User-specified (default 25565)
- Private Port: Same as public (1:1 mapping)
- Description: "LazyCraftLauncher Minecraft Server"
- TTL: 0 (permanent until router reboot)

**Recent Fixes** (2025-11):
- Added safe cleanup: Checks if `client.close()` method exists before calling
- Prevents crash from library version incompatibilities
- Gracefully handles missing cleanup methods with try-catch

**Firewall Configuration**:

**Windows** (`setupWindowsFirewall`):
```bash
# Remove old rule
netsh advfirewall firewall delete rule name="LazyCraftLauncher"

# Add new rule
netsh advfirewall firewall add rule name="LazyCraftLauncher" dir=in action=allow protocol=TCP localport=25565
```
- Requires Administrator elevation
- Falls back to manual instructions if access denied

**macOS** (`setupMacFirewall`):
```bash
# Add Java to firewall exceptions
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/bin/java

# Unblock Java
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock /usr/bin/java
```
- Prompts for sudo password
- Falls back to GUI instructions if SIP blocks automation

**Linux** (`setupLinuxFirewall`):
```bash
# Try iptables first
sudo iptables -A INPUT -p tcp --dport 25565 -j ACCEPT

# Fallback to ufw
sudo ufw allow 25565/tcp
```
- Tries both firewall systems
- Provides manual instructions for other firewalls (firewalld, nftables)

**Port Reachability Testing**:

```typescript
async function testPortReachability(publicIP: string, port: number): Promise<boolean>
```

- Uses external service `https://portchecker.io` API
- Tests port from outside the local network
- Called 5 seconds after server starts (allows server to fully initialize)
- Returns boolean result for UI display

**Network Result Display**:
- ✅ Green: "Your friends can connect from anywhere!" (reachable)
- ⚠️ Yellow: "Local only. Try UPnP toggle, manual port forward, or Tailscale" (not reachable)

---

### World Management System (`world.ts`)

Validates Minecraft worlds and manages world directories.

**World Validation Process**:

```typescript
async function validateWorldDetailed(worldPath: string): Promise<ValidationResult>
```

**Essential Validation Checks** (Errors if missing):
1. **Path Exists**: Directory must exist at specified path
2. **Is Directory**: Path must be a directory, not a file
3. **level.dat Present**: Core world data file must exist
4. **region/ Directory**: Chunk data directory must exist

**Optional Validation Checks** (Warnings only):
1. **Region Files**: Checks for `.mca` files (region chunks)
   - Warning if empty: "No region files found (world may be empty)"
2. **data/ Directory**: Server data (advancements, structures, etc.)
   - Warning if missing: "Missing data/ directory (will be created on first run)"
3. **playerdata/ Directory**: Player data storage
   - Warning if missing: "Missing playerdata/ directory (will be created when players join)"
4. **level.dat_old**: Backup world data
   - Warning if missing: "No level.dat_old backup found"

**World Preparation**:

```typescript
async function prepareWorld(worldPath: string, isNew: boolean): Promise<void>
```

**New World Path**:
1. Creates empty directory
2. Server generates world on first launch
3. Uses profile settings for world generation

**Existing World Path**:
1. Runs detailed validation
2. Throws error if essential files missing
3. Displays warnings for optional files
4. Logs validation results

**World Information Extraction**:

```typescript
async function getWorldInfo(worldPath: string): Promise<WorldInfo>
```

Planned to extract world metadata from `level.dat`:
- World name
- Seed
- Game version
- Game rules
- World type (flat, normal, large biomes, etc.)
- Difficulty
- Hardcore mode flag

**Note**: Full implementation requires NBT (Named Binary Tag) parsing library. Currently returns basic existence check.

**World Import/Export**:

```typescript
async function copyWorld(source: string, destination: string): Promise<void>
```

- Recursively copies world directory
- Preserves file timestamps
- Fails if destination already exists (safety)
- Used for world portability between servers

---

### Server Process Management (`run.ts`)

Manages the Minecraft server Java process lifecycle.

**Server Startup Process**:

```typescript
async function startServer(config: LazyConfig): Promise<ChildProcess>
```

**Startup Sequence**:
1. **JAR Verification**: Ensures `server.jar` exists
2. **Command Construction**: Builds Java command with parameters
3. **Process Spawn**: Launches Java with `child_process.spawn()`
4. **Stream Setup**: Pipes stdout/stderr to log file
5. **Event Handlers**: Attaches listeners for output and events
6. **Ready Detection**: Monitors for "Done" message in logs

**Java Command Structure**:
```bash
java \
  -Xms4G \              # Initial heap size
  -Xmx4G \              # Maximum heap size
  -jar server.jar \     # Server JAR path
  nogui                 # No GUI mode
```

**Log Management**:
- Log file: `logs/server-YYYYMMDD.log`
- Date-based rotation (new file each day)
- Both stdout and stderr captured
- Real-time streaming (not buffered)

**Server Monitoring**:

The process monitors server output for key events:

**Server Ready Detection**:
```javascript
if (text.includes('Done') && text.includes('For help, type'))
```
- Detects when server finishes loading
- Triggers `onServerReady()` callback
- Displays success message to user
- Initiates port reachability test

**Player Join Detection**:
```javascript
if (text.includes('joined the game'))
```
- Extracts player username from log
- Updates player list in status
- Logs event for API consumers

**Player Leave Detection**:
```javascript
if (text.includes('left the game'))
```
- Removes player from active list
- Updates dashboard display

**Server Shutdown**:

```typescript
async function stopServer(): Promise<void>
```

**Graceful Shutdown Process**:
1. **Stop Command**: Sends "stop" to server stdin
2. **Wait Period**: Allows up to 30 seconds for graceful shutdown
3. **Save Completion**: Server saves world and configuration
4. **Process Exit**: Waits for process exit event
5. **Force Kill**: If timeout exceeded, sends SIGKILL

**Server Restart**:

```typescript
async function restartServer(config: LazyConfig): Promise<ChildProcess>
```

1. Stops current server (graceful shutdown)
2. Waits 2 seconds for port release
3. Starts new server process
4. Maintains same configuration

**Console Command Interface**:

```typescript
function sendCommand(command: string): boolean
```

Allows sending commands to server console:
- `say <message>` - Broadcast message
- `op <player>` - Grant operator status
- `whitelist add <player>` - Add to whitelist
- `ban <player>` - Ban player
- `kick <player>` - Kick player
- Any valid Minecraft server command

**Server Status Tracking**:

```typescript
function getUptime(): number
```
- Tracks time since server start
- Returns uptime in seconds
- Used for dashboard display

```typescript
function isServerRunning(): boolean
```
- Checks if process exists and is alive
- Returns boolean status

---

### Java Detection and Installation System (`java.ts`)

Automatically detects Java or downloads a portable JRE.

**Java Detection Process**:

```typescript
async function ensureJava(systemInfo: SystemInfo): Promise<string>
```

**Detection Steps**:
1. **PATH Search**: Checks for `java` command in system PATH
2. **Version Check**: Runs `java -version` to verify Java 17 or 21
3. **Local JRE Check**: Looks for previously downloaded JRE in `./jre/`
4. **Download Decision**: If not found, downloads Adoptium Temurin JRE

**Adoptium Temurin Download**:
- Source: https://adoptium.net/
- Version: Latest Java 21 LTS
- Distribution: JRE (not full JDK - smaller size)
- Platform: Matches host OS and architecture
- Installation: Extracts to `./jre/` directory
- Portability: Self-contained, no system installation required

**Download Process**:
1. Detects OS and architecture (x64, arm64)
2. Queries Adoptium API using two endpoints:
   - Primary: `/assets/latest/21/hotspot` - Returns array with `binary.package.link`
   - Fallback: `/assets/feature_releases/21/ga` - Returns `binaries[].package.link` structure
3. Parses JSON response directly (no longer relies on 307 redirects)
4. Shows progress bar during download
5. Extracts archive (tar.gz for Unix, zip for Windows)
6. Sets executable permissions on Unix systems
7. Locates Java binary using platform-specific search:
   - macOS: Checks `Contents/Home/bin/java` (app bundle structure)
   - Standard: Checks `bin/java` directly
   - Fallback: Recursive search through extracted directories
8. Returns path to Java binary

**Java Path Resolution**:
- Windows: `./jre/<jdk-dir>/bin/java.exe`
- macOS: `./jre/<jdk-dir>/Contents/Home/bin/java` (app bundle)
- Linux: `./jre/<jdk-dir>/bin/java`
- System: `java` (if found in PATH)

**Recent Fixes** (2025-11):
- Fixed Adoptium API response parsing to handle different JSON structures
- Added macOS-specific path resolution for app bundle structure
- Implemented recursive search fallback for changing extraction layouts
- Added 30-second timeout for API requests

**User Messages**:
- "No Java found. Predictable. Fetching a JRE so you don't have to Google it."
- Progress bar during download
- "Java installed and ready!"

---

### Server JAR Management (`serverJar.ts`)

Downloads and manages Minecraft server JARs for different server types.

**Server Type Resolution**:

```typescript
async function setupServer(config: LazyConfig): Promise<void>
```

**Vanilla Server Setup**:
1. **Version Manifest**: Fetches from `https://launchermeta.mojang.com/mc/game/version_manifest.json`
2. **Version Resolution**:
   - "latest" → Resolves to latest release version
   - Specific version (e.g., "1.21.3") → Downloads that version
   - Validates version exists
3. **JAR Download**: Downloads server JAR from Mojang CDN
4. **Verification**: Verifies SHA256 checksum
5. **Placement**: Saves as `./server/vanilla-{version}.jar`
6. **Symlink**: Creates `./server.jar` symlink to active version

**Forge Server Setup**:
1. **Forge Manifest**: Fetches Forge versions from `https://files.minecraftforge.net/`
2. **Installer Download**: Downloads Forge installer JAR
3. **Installation**: Runs installer in headless mode:
   ```bash
   java -jar forge-installer-{version}.jar --installServer
   ```
4. **Library Download**: Forge installer downloads required libraries
5. **Launch Script**: Generates forge server launcher
6. **Symlink**: Creates `./server.jar` symlink

**Fabric Server Setup** (Planned):
- Downloads Fabric installer
- Installs Fabric loader
- Downloads Minecraft server JAR
- Creates Fabric launch configuration

**Paper Server Setup** (Planned):
- Downloads from Paper API
- Verifies build checksums
- Handles version upgrades

**Version Caching**:
- Already downloaded JARs reused
- Version manifest cached for 24 hours
- Checksum verification on cached files

---

### EULA Management (`eula.ts`)

Handles Mojang End User License Agreement acceptance.

**EULA Process**:

```typescript
async function acceptEULA(): Promise<void>
```

**Workflow**:
1. **Display**: Shows EULA URL (`https://www.minecraft.net/en-us/eula`)
2. **Acceptance**: Automatically accepts on user's behalf
3. **File Creation**: Creates `eula.txt` with content:
   ```
   #By changing the setting below to TRUE you are indicating your agreement to our EULA (https://www.minecraft.net/en-us/eula).
   #Tue Nov 05 12:34:56 UTC 2025
   eula=true
   ```
4. **Logging**: Records acceptance timestamp in setup report
5. **Confirmation**: Displays confirmation message

**Philosophy**:
The launcher accepts the EULA automatically because:
- Users have already chosen to use the launcher
- The launcher is specifically for Minecraft server hosting
- Manual acceptance is a friction point for non-technical users
- EULA URL is clearly displayed
- Acceptance is logged for transparency

**User Message**:
- "EULA time. You never read these. I did for you."

---

### Server Properties Generation (`props.ts`)

Generates `server.properties` file based on profile templates.

**Profile System**:

Three preset profiles available:

**1. Survival Default** (`survival-default.yml`):
```yaml
motd: "LazyCraft Survival Server"
difficulty: normal
gamemode: survival
pvp: true
spawn-protection: 16
max-players: 20
view-distance: 10
simulation-distance: 10
hardcore: false
```

**2. Creative Flat** (`creative-flat.yml`):
```yaml
motd: "LazyCraft Creative Server"
difficulty: peaceful
gamemode: creative
level-type: flat
pvp: false
spawn-protection: 0
max-players: 20
view-distance: 10
simulation-distance: 10
hardcore: false
```

**3. Hardcore Minimal** (`hardcore-minimal.yml`):
```yaml
motd: "LazyCraft Hardcore Server - One Life!"
difficulty: hard
gamemode: survival
hardcore: true
pvp: true
spawn-protection: 4
max-players: 10
view-distance: 8
simulation-distance: 8
```

**Property Generation**:

```typescript
async function generateServerProperties(config: LazyConfig): Promise<void>
```

**Process**:
1. **Profile Load**: Reads profile YAML from `templates/profiles/`
2. **Template Load**: Loads Handlebars template from `templates/server.properties.hbs`
3. **Merge**: Combines profile settings with user config:
   - Port from config
   - World name from config
   - RAM settings (for performance tuning)
   - Online mode (typically true for multiplayer)
4. **Render**: Processes template with merged data
5. **Write**: Saves to `server.properties` in server directory

**Customization Support**:
Users can edit generated `server.properties` directly. Changes persist across restarts unless profile is changed.

---

### Status Monitoring System (`status.ts`)

Polls server status and extracts runtime information.

**Status Polling**:

```typescript
async function getServerStatus(
  config: LazyConfig,
  networkInfo: NetworkInfo,
  serverProcess: ChildProcess
): Promise<ServerStatus>
```

**Information Sources**:
1. **Process Status**: Checks if server process is running
2. **Log Parsing**: Reads recent log entries for events
3. **Memory Usage**: Queries Java process memory (via process stats)
4. **Player List**: Extracts from "player joined/left" log messages
5. **TPS (Ticks Per Second)**: Parses from debug messages if available
6. **Uptime**: Calculates from server start time

**Player Tracking**:
- Maintains in-memory list of online players
- Updates on join/leave events
- Persists player session times
- Tracks total unique players

**Performance Metrics**:
- **TPS**: Server performance indicator (target: 20 TPS)
- **Memory**: Heap usage vs. maximum allocation
- **Uptime**: Server runtime in seconds
- **World Size**: Disk space used by world folder

**Status Object**:
```typescript
interface ServerStatus {
  running: boolean;
  version: string;
  players: string[];
  playerCount: number;
  maxPlayers: number;
  uptime: number;
  memory: {
    used: number;    // MB
    max: number;     // MB
    percentage: number;
  };
  tps?: number;
  worldSize?: number;  // MB
}
```

---

### QR Code Generation (`qr.ts`)

Generates QR codes for easy server address sharing.

**QR Code Generation**:

```typescript
async function generateQRCode(ip: string, port: number): Promise<QRCodeInfo>
```

**Encoding**:
- Format: `<IP>:<PORT>` (e.g., `203.0.113.50:25565`)
- Error Correction: Medium (M) level
- Size: Dynamically scales based on terminal width

**Output Formats**:

**1. Terminal Display**:
- Uses Unicode block characters (█, ▀, ▄)
- Renders directly in terminal
- Colors: Black blocks on white background
- Readable by phone QR scanners

**2. PNG File**:
- Saves to `server-qr.png`
- Resolution: 300x300 pixels
- Include server info text below QR code
- Shareable via Discord, email, etc.

**Usage**:
Players scan QR code with phone, copy address to Minecraft client

**Display Location**:
- Dashboard address panel
- Setup report file
- Shareable image file

---

### Setup Report Generation (`report.ts`)

Creates comprehensive setup summary document.

**Report Generation**:

```typescript
async function createReport(setupData: SetupData): Promise<void>
```

**Report Sections**:

**1. Server Configuration**:
- Server type (Vanilla/Forge/etc.)
- Minecraft version
- RAM allocation
- Port number
- Game profile

**2. Network Information**:
- LAN IP address
- Public IP address (if detected)
- UPnP status (success/failure)
- Firewall configuration status
- Port reachability test result

**3. World Information**:
- World path
- World type (new/existing)
- World size (disk space)
- Validation results

**4. Java Information**:
- Java version
- Java path
- Heap size configuration

**5. EULA Acceptance**:
- EULA URL
- Acceptance timestamp
- Confirmation of consent

**6. Troubleshooting Info**:
- QR code path
- Manual port forwarding instructions (if needed)
- Firewall command (if automation failed)
- Connection addresses for players

**Report Format**:
```
================================================
     LAZYCRAFTLAUNCHER SETUP REPORT
================================================

Generated: 2025-11-05 12:34:56 UTC

[SERVER CONFIGURATION]
- Type: Vanilla
- Version: 1.21.3
- RAM: 4GB
- Port: 25565
- Profile: Survival Default
- World: ./world (new world)

[NETWORK]
- LAN IP: 192.168.1.100
- Public IP: 203.0.113.50
- UPnP: SUCCESS
- Firewall: Configured
- Reachable: YES ✓

[CONNECTION INFO]
Your friends can connect using:
  203.0.113.50:25565

QR Code saved to: server-qr.png

[EULA]
Accepted at: 2025-11-05 12:34:56 UTC
https://www.minecraft.net/en-us/eula

[JAVA]
Version: OpenJDK 21.0.1
Path: ./jre/bin/java

================================================
```

**File Location**: `setup-report.txt` in server directory

---

### API Server (`api.ts`)

REST API for external integrations and automation.

**Server Configuration**:
- Framework: Fastify (high-performance HTTP server)
- Host: `127.0.0.1` (localhost only - security)
- Port: `8765`
- CORS: Disabled (local only)
- Auth: None required (local access only)

**Endpoints**:

**GET /status**
Returns current server status:
```json
{
  "running": true,
  "version": "1.21.3",
  "serverType": "vanilla",
  "players": ["Steve", "Alex"],
  "playerCount": 2,
  "maxPlayers": 20,
  "uptime": 3600,
  "memory": {
    "used": 2048,
    "max": 4096,
    "percentage": 50
  },
  "port": 25565,
  "lanIP": "192.168.1.100",
  "publicIP": "203.0.113.50",
  "reachable": true,
  "tps": 20.0,
  "worldSize": 512
}
```

**GET /config**
Returns current configuration:
```json
{
  "version": "1.0.0",
  "serverType": "vanilla",
  "minecraftVersion": "latest",
  "worldPath": "./world",
  "port": 25565,
  "ramGB": 4,
  "profile": "survival-default",
  "upnpEnabled": true,
  "backupOnExit": true
}
```

**POST /action/start**
Starts the server:
- Request body: Empty or `{}`
- Response: `202 Accepted` with operation ID
- Async operation (use /status to poll)

**POST /action/stop**
Stops the server gracefully:
- Request body: Empty or `{}`
- Response: `202 Accepted` with operation ID
- Creates backup if configured
- 30-second graceful shutdown timeout

**POST /action/restart**
Restarts the server:
- Request body: Empty or `{}`
- Response: `202 Accepted` with operation ID
- Equivalent to stop + wait + start

**POST /action/backup**
Creates immediate backup:
- Request body: Empty or `{}`
- Response: `202 Accepted` with backup info
- Returns backup filename and size

**POST /command**
Sends console command to server:
- Request body: `{ "command": "say Hello world" }`
- Response: `200 OK` if sent, `400 Bad Request` if server not running

**Use Cases**:
- Discord bots (announce server status)
- Web dashboards
- Automation scripts
- Monitoring systems (Prometheus, Grafana)
- CI/CD pipelines for testing

---

### System Detection (`detect.ts`)

Detects system capabilities and configuration.

**System Information Detection**:

```typescript
async function detectSystem(): Promise<SystemInfo>
```

**Detection Capabilities**:

**1. Operating System**:
- Platform: Windows, macOS, Linux, FreeBSD, etc.
- Version: Major/minor version numbers
- Architecture: x64, arm64, x86

**2. Memory (RAM)**:
- Total RAM in GB
- Available RAM in GB
- Used RAM percentage
- Recommended allocation (80% max)

**3. CPU**:
- Core count (physical cores)
- Thread count (logical cores)
- CPU model/brand
- Architecture (x64, ARM)

**4. Network**:
- Local IP addresses (all interfaces)
- Primary LAN IP (for multiplayer)
- Network interfaces (Ethernet, WiFi, etc.)
- Default gateway

**5. Disk Space**:
- Available disk space
- Total disk capacity
- Recommended minimum (10GB for server)

**6. Java Detection**:
- Java installed (true/false)
- Java version (if installed)
- Java path (if in PATH)

**SystemInfo Object**:
```typescript
interface SystemInfo {
  os: 'windows' | 'mac' | 'linux';
  osVersion: string;
  platform: string;
  arch: string;
  totalRAMGB: number;
  availableRAMGB: number;
  cpuCores: number;
  cpuThreads: number;
  cpuModel: string;
  diskSpaceGB: number;
  networkInterfaces: NetworkInterface[];
  javaInstalled: boolean;
  javaVersion?: string;
}
```

**Local IP Detection**:

```typescript
function getLocalIP(): string
```

Finds primary local network IP:
1. Lists all network interfaces
2. Filters out loopback (127.0.0.1)
3. Filters out link-local (169.254.x.x)
4. Prioritizes Ethernet over WiFi
5. Returns most likely LAN IP

---

### Downloads System (`downloads.ts`)

Handles all file downloads with progress reporting.

**Generic Download Function**:

```typescript
async function downloadFile(
  url: string,
  destination: string,
  options?: DownloadOptions
): Promise<void>
```

**Features**:
- Progress bar with percentage and speed
- Resume support for interrupted downloads
- Checksum verification (SHA256)
- Retry logic (up to 3 attempts)
- Timeout handling
- Proxy support

**Download Types**:

**1. Server JARs**:
- Vanilla from Mojang CDN
- Forge from Forge Maven
- Fabric from Fabric Maven
- Paper from Paper API

**2. Java Runtime**:
- Adoptium Temurin JRE
- Platform-specific (Windows/Mac/Linux)
- Architecture-specific (x64/ARM)

**3. Dependencies**:
- Forge libraries
- Fabric loader
- Plugin dependencies

**Progress Display**:
```
Downloading Minecraft server 1.21.3...
[████████████████░░░░] 78% (42.3 MB / 54.2 MB) 3.2 MB/s
```

**Checksum Verification**:
- Computes SHA256 hash
- Compares against manifest
- Rejects corrupted downloads
- Retries on mismatch

---

## User Interface Components

### Wizard Component (`Wizard.tsx`)

Multi-step interactive setup wizard built with Ink.

**Wizard Flow**:

```
 ┌─────────────┐
 │    Mode     │  Quick Launch vs Advanced Setup
 └──────┬──────┘
        │
 ┌──────▼──────┐
 │Server Type  │  Vanilla, Forge, Fabric, Paper
 └──────┬──────┘
        │
 ┌──────▼──────┐
 │  Version    │  Latest or specific version
 └──────┬──────┘
        │
 ┌──────▼──────┐
 │   World     │  New or existing world
 └──────┬──────┘
        │
 ┌──────▼──────┐
 │ World Path  │  (if existing)
 └──────┬──────┘
        │
 ┌──────▼──────┐
 │    RAM      │  Allocation in GB
 └──────┬──────┘
        │
 ┌──────▼──────┐
 │    Port     │  Server port
 └──────┬──────┘
        │
 ┌──────▼──────┐
 │   Profile   │  Game preset
 └──────┬──────┘
        │
 ┌──────▼──────┐
 │  Advanced   │  UPnP, Backup settings
 └──────┬──────┘
        │
 ┌──────▼──────┐
 │   Confirm   │  Summary and confirmation
 └─────────────┘
```

**Step Components**:

**Mode Selection**:
- Options: Quick Launch (if config exists), Advanced Setup
- Quick mode: Loads saved config and skips wizard
- Advanced mode: Proceeds through all steps

**Server Type Selection**:
- Options: Vanilla ✓, Forge ✓, Fabric (coming soon), Paper (coming soon)
- Displays brief description of each type
- Disables unavailable options

**Version Input**:
- Text input field
- Default: "latest"
- Validation: Checks version exists in manifest
- Examples shown: "1.21.3", "1.20.1", "latest"

**World Setup**:
- Options: Create new world, Use existing world
- New world: Creates empty directory
- Existing world: Prompts for path, validates

**World Path Input** (conditional):
- Only shown if "Use existing world" selected
- Text input with default: "./world"
- Real-time validation: Checks for level.dat and region/
- Error display: "Invalid world folder. Missing level.dat. Try again."

**RAM Allocation**:
- Text input in GB
- Displays system RAM: "System: 16GB"
- Validation: 1GB minimum, 80% of system RAM maximum
- Error: "Too much RAM! You have 16GB total. Max recommended: 12GB"

**Port Configuration**:
- Text input
- Default: 25565 (Minecraft standard)
- Validation: Range 1024-65535
- Port conflict detection (checks if in use)

**Profile Selection**:
- Options:
  - Survival Default - Normal survival gameplay
  - Creative Flat - Peaceful creative mode
  - Hardcore Minimal - Hard difficulty, one life
- Displays full profile description on selection

**Advanced Settings**:
- Toggle UPnP port forwarding (default: enabled)
- Toggle backup on exit (default: enabled)
- Binary choices with visual indicators

**Confirmation**:
- Summary of all selections
- Options: "Yes, launch server!" or "No, start over"
- Displays configuration in formatted list

**UI Features**:
- Arrow key navigation
- Enter to confirm
- Backspace to go back (on text inputs)
- Esc to cancel (shows confirmation prompt)
- Color-coded validation errors (red)
- Success messages (green)
- Input hints (gray)

---

### Dashboard Component (`Dashboard.tsx`)

Real-time server monitoring and control interface.

**Dashboard Layout**:

```
┌────────────────────────────────────────────────────────────┐
│                  LAZY CRAFT LAUNCHER                        │
│             "You ask to play, we host for you."            │
├──────────────────────────┬─────────────────────────────────┤
│  ┌─── STATUS ─────────┐ │ ┌─── CONNECTION ──────────────┐ │
│  │ ● Running          │ │ │ LAN:    192.168.1.100:25565 │ │
│  │ Version: 1.21.3    │ │ │ Public: 203.0.113.50:25565  │ │
│  │ Uptime:  2h 15m    │ │ │ QR Code: server-qr.png      │ │
│  │ Memory:  2.1/4.0GB │ │ │                             │ │
│  │ Players: 2/20      │ │ │ ✓ Reachable from internet   │ │
│  │ TPS:     20.0      │ │ │                             │ │
│  └────────────────────┘ │ └─────────────────────────────┘ │
├──────────────────────────┴─────────────────────────────────┤
│                                                             │
│  [  Restart  ] [ Backup ] [   Stop   ]                    │
│       ▲          (Enter to execute)                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ✓ Your friends can connect from anywhere!                  │
│ Share this address: 203.0.113.50:25565                     │
├─────────────────────────────────────────────────────────────┤
│ Arrow keys: Navigate  │ Enter: Execute  │ Q/Esc: Quit      │
└─────────────────────────────────────────────────────────────┘
```

**Status Panel**:
- **Running State**: Color-coded indicator
  - 🟢 Green: Running normally
  - 🟡 Yellow: Starting up
  - 🔴 Red: Stopped
- **Version**: Minecraft version (e.g., "1.21.3")
- **Uptime**: Human-readable format (2h 15m 30s)
- **Memory**: Used/Total with percentage bar
- **Players**: Online count / max players with list
- **TPS**: Server performance (target: 20.0)

**Connection Panel**:
- **LAN IP**: Local network address for LAN players
- **Public IP**: Internet address for remote players
- **QR Code**: Path to QR code image for sharing
- **Reachability**: Status with icon and message
  - ✓ Green: "Reachable from internet"
  - ⚠ Yellow: "Local only (see troubleshooting)"

**Action Buttons**:
- **Restart**: Gracefully restarts server
  - Announces restart to players
  - Saves world
  - Waits for stop
  - Starts new process
- **Backup**: Creates immediate backup
  - Shows progress
  - Confirms completion
  - Displays backup filename
- **Stop**: Stops server and exits
  - Creates backup if enabled
  - Announces shutdown to players
  - Graceful 30-second timeout
  - Exits launcher

**Keyboard Controls**:
- **Left/Right Arrow**: Select action button
- **Enter**: Execute selected action
- **Q**: Quit (with confirmation)
- **Esc**: Quit (with confirmation)
- **B**: Quick backup (direct shortcut)
- **R**: Quick restart (direct shortcut)

**Real-Time Updates**:
- Status refreshes every 5 seconds
- Player list updates on join/leave
- Memory usage live tracking
- TPS monitoring (if available)
- Smooth animations on updates

**Network Status Messages**:

**Success** (Green):
```
✓ Your friends can connect from anywhere!
Share this address: 203.0.113.50:25565
```

**Warning** (Yellow):
```
⚠ Local only access
Try: UPnP toggle in router, manual port forward, or Tailscale
LAN address: 192.168.1.100:25565
```

---

### UI Components

#### Banner Component (`Banner.tsx`)

Displays ASCII art header with gradient coloring.

**Content**:
```
===================================
   LAZY CRAFT LAUNCHER
   "You ask to play, we host for you."
===================================
```

**Styling**:
- Rainbow gradient using `gradient-string`
- ASCII art from `assets/ascii.txt`
- Centered alignment
- Displayed at top of all screens

---

#### Status Panel Component (`StatusPanel.tsx`)

Renders server status information in formatted panel.

**Props**:
```typescript
interface StatusPanelProps {
  status: ServerStatus | null;
  config: LazyConfig;
}
```

**Rendering**:
- Boxed panel with border
- Color-coded status indicator
- Icon for running state (●)
- Progress bar for memory usage
- Player list (expandable if > 5 players)
- TPS with color coding:
  - Green: 19-20 TPS (excellent)
  - Yellow: 15-18 TPS (good)
  - Red: <15 TPS (poor)

---

#### Address Panel Component (`AddressPanel.tsx`)

Displays connection information for players.

**Props**:
```typescript
interface AddressPanelProps {
  networkInfo: NetworkInfo;
}
```

**Display Elements**:
- LAN IP with port (always shown)
- Public IP with port (if detected)
- QR code file path (if generated)
- Copy-friendly formatting
- Reachability status with icon

**Copy Helper**:
- Addresses formatted for easy copying
- Monospace font for precision
- No extra characters or formatting

---

#### Action Buttons Component (`ActionButtons.tsx`)

Renders action buttons with keyboard navigation.

**Props**:
```typescript
interface ActionButtonsProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
}
```

**Buttons**:
- Index 0: Restart
- Index 1: Backup
- Index 2: Stop

**Visual States**:
- **Selected**: Highlighted background, bold text
- **Unselected**: Normal text
- **Disabled**: Grayed out (if action unavailable)

**Styling**:
- Consistent button width
- Centered alignment
- Keyboard focus indicator
- Hover effect (selected state)

---

## Platform-Specific Implementations

### Windows Platform (`windows.ts`)

Windows-specific implementations for system integration.

**Firewall Management**:
- Uses `netsh advfirewall` commands
- Requires Administrator elevation
- Creates inbound rules for TCP traffic
- Rule name: "LazyCraftLauncher"

**Java Path Resolution**:
- Searches common installation directories:
  - `C:\Program Files\Java\`
  - `C:\Program Files (x86)\Java\`
  - `%JAVA_HOME%`
- Checks registry for Java installations

**Process Management**:
- Uses `tasklist` to check running processes
- Uses `taskkill` for force termination
- Handles Windows-specific process IDs

**Path Handling**:
- Converts forward slashes to backslashes
- Handles drive letters
- Supports UNC paths

---

### macOS Platform (`mac.ts`)

macOS-specific implementations.

**Firewall Management**:
- Uses `socketfilterfw` command line tool
- Requires `sudo` elevation
- Adds Java to firewall exceptions
- Falls back to GUI instructions if SIP blocks

**Application Bundle Support**:
- Can create `.app` bundle for distribution
- Handles app bundle directory structure
- Integrates with Finder

**Java Detection**:
- Checks `/Library/Java/JavaVirtualMachines/`
- Checks `$JAVA_HOME`
- Uses `/usr/libexec/java_home` utility

---

## Utility Systems

### Path Management (`paths.ts`)

Centralizes all path resolution for consistency.

**Path Functions**:

```typescript
function getPaths(): Paths
```

Returns standardized paths object:
```typescript
interface Paths {
  root: string;           // Working directory (server root)
  logs: string;           // ./logs/
  backups: string;        // ./backups/
  temp: string;           // ./temp/
  server: string;         // ./server/
  world: string;          // ./world/ (default)
  config: string;         // ./.lazycraft.yml
  eula: string;           // ./eula.txt
  properties: string;     // ./server.properties
  serverJar: string;      // ./server.jar
}
```

**Benefits**:
- Single source of truth for paths
- Easy to relocate directories
- Consistent across all modules
- Cross-platform compatibility

---

### Logging System (`log.ts`)

Centralized logging with file output and rotation.

**Logger Interface**:

```typescript
const logger = {
  info(message: string, ...args: any[]): void,
  warn(message: string, ...args: any[]): void,
  error(message: string, ...args: any[]): void,
  debug(message: string, ...args: any[]): void,
}
```

**Log Levels**:
- **DEBUG**: Detailed debugging information
- **INFO**: General informational messages
- **WARN**: Warning messages (non-critical issues)
- **ERROR**: Error messages (critical issues)

**Log Output**:
- **File**: `logs/launcher-YYYYMMDD.log`
- **Console**: ERROR level only (to avoid UI interference)
- **Format**: `[TIMESTAMP] [LEVEL] message`

**Log Rotation**:
- Daily rotation (new file each day)
- Keeps last 30 days
- Automatic compression of old logs (gzip)
- Size-based rotation (max 100MB per file)

**Usage Example**:
```typescript
logger.info('Server started successfully');
logger.warn('UPnP failed, falling back to manual configuration');
logger.error('Failed to download server JAR', error);
```

---

### Command Execution (`exec.ts`)

Wrapper for safe command execution.

**Execution Function**:

```typescript
async function exec(
  command: string,
  args: string[],
  options?: ExecOptions
): Promise<ExecResult>
```

**Features**:
- Promise-based API
- Stdout/stderr capture
- Exit code handling
- Timeout support
- Working directory support
- Environment variable injection

**Security**:
- No shell injection vulnerabilities
- Argument escaping
- Input validation
- Output sanitization

**Example**:
```typescript
const result = await exec('java', ['-version'], { timeout: 5000 });
console.log(result.stdout);
```

---

## Data Flow and Lifecycles

### Application Startup Flow

```
1. main.ts executed
   ↓
2. Parse command-line arguments
   ↓
3. Initialize directories (logs, backups, temp)
   ↓
4. Start API server (background)
   ↓
5. Render React app (cli.tsx)
   ↓
6. Display banner
   ↓
7. Detect system info
   ↓
8. Load saved config (if exists)
   ↓
9. Determine mode:
   ├─ Quick Mode → Skip to setup
   └─ Wizard Mode → Show wizard
      ↓
10. Collect user configuration
    ↓
11. Run setup sequence:
    ├─ Ensure Java
    ├─ Download server JAR
    ├─ Accept EULA
    ├─ Configure network
    ├─ Generate properties
    └─ Start server
       ↓
12. Display dashboard
    ↓
13. Poll status every 5 seconds
    ↓
14. Handle user input (keyboard)
    ↓
15. On quit:
    ├─ Create backup (if enabled)
    ├─ Stop server gracefully
    └─ Exit process
```

### Server Startup Lifecycle

```
1. startServer() called with config
   ↓
2. Verify server.jar exists
   ↓
3. Construct Java command
   ↓
4. Spawn Java process
   ↓
5. Pipe stdout/stderr to log file
   ↓
6. Server initialization begins
   ↓
7. Server loads world
   ↓
8. Server binds to port
   ↓
9. Server logs "Done" message
   ↓
10. onServerReady() triggered
    ↓
11. Test port reachability
    ↓
12. Display connection info
    ↓
13. Server running (accept connections)
```

### Backup Creation Lifecycle

```
1. User triggers backup (exit or manual)
   ↓
2. createBackup() called
   ↓
3. Generate timestamp filename
   ↓
4. Create AdmZip instance
   ↓
5. Add world folder recursively
   ↓
6. Add config files (server.properties, etc.)
   ↓
7. Write ZIP file
   ↓
8. List existing backups
   ↓
9. Sort by timestamp
   ↓
10. Delete backups beyond retention (keep 7)
    ↓
11. Return BackupInfo
```

---

## Configuration and State Management

### Configuration Persistence

**Storage Location**: `.lazycraft.yml` in server root

**Persistence Strategy**:
- Save after wizard completion
- Save after setup success
- Save on configuration changes
- Update `lastRun` timestamp

**Configuration Loading**:
- Load on application startup
- Validate schema and version
- Migrate from old versions
- Merge with defaults for missing fields

**Quick Launch Logic**:
```typescript
if (savedConfig exists && --quick flag) {
  Load saved config
  Skip wizard
  Proceed to setup
}
```

### State Management Strategy

**Application State**:
- React `useState` hooks for UI state
- Module-level variables for process state
- Configuration persisted to YAML
- Runtime state not persisted (intentional)

**State Hierarchy**:
```
Application Level (cli.tsx)
├─ appState: loading | wizard | setup | dashboard | error
├─ config: LazyConfig
├─ systemInfo: SystemInfo
├─ networkInfo: NetworkInfo
└─ serverProcess: ChildProcess

Wizard Level (Wizard.tsx)
├─ currentStep: string
├─ answers: WizardAnswers
└─ validationError: string | null

Dashboard Level (Dashboard.tsx)
├─ status: ServerStatus
├─ selectedAction: number
└─ message: string | null
```

---

## Network Architecture

### Network Configuration Flow

```
setupNetwork()
    ↓
┌───────────────────────┐
│ Get LAN IP            │
│ (os.networkInterfaces)│
└───────┬───────────────┘
        ↓
┌───────────────────────┐
│ Get Public IP         │
│ (api.ipify.org)       │
└───────┬───────────────┘
        ↓
┌───────────────────────┐
│ Setup UPnP            │
│ (nat-api)             │
└───────┬───────────────┘
        ↓
┌───────────────────────┐
│ Configure Firewall    │
│ (platform-specific)   │
└───────┬───────────────┘
        ↓
┌───────────────────────┐
│ Return NetworkInfo    │
└───────────────────────┘
```

### UPnP Protocol Flow

```
1. Discover router (SSDP)
   ↓
2. Fetch device description
   ↓
3. Parse service list
   ↓
4. Find WANIPConnection service
   ↓
5. Call AddPortMapping
   ├─ Protocol: TCP
   ├─ External Port: 25565
   ├─ Internal Port: 25565
   ├─ Internal IP: 192.168.1.100
   ├─ Description: "LazyCraftLauncher"
   └─ Duration: 0 (permanent)
      ↓
6. Verify mapping created
   ↓
7. Return success/failure
```

### Port Reachability Test

```
1. Server must be running
   ↓
2. Wait 5 seconds (server initialization)
   ↓
3. Query portchecker.io API
   ├─ URL: https://portchecker.io/check
   ├─ Params: host=<publicIP>, port=<port>
   └─ Timeout: 10 seconds
      ↓
4. Parse response
   ├─ Success: Contains "open" or "reachable"
   └─ Failure: Contains "closed" or "filtered"
      ↓
5. Update networkInfo.reachable
   ↓
6. Display result in dashboard
```

---

## Server Management

### Server Version Resolution

**Vanilla Version Resolution**:
```
1. Fetch manifest from Mojang
   ↓
2. Parse JSON manifest
   ↓
3. If "latest":
   ├─ Find latest release version
   └─ Exclude snapshots
   Else:
   ├─ Search for specific version
   └─ Throw error if not found
      ↓
4. Extract download URL
   ↓
5. Download server.jar
   ↓
6. Verify SHA256 checksum
   ↓
7. Save to server directory
```

**Forge Version Resolution**:
```
1. Fetch Forge version list
   ↓
2. Find Forge version for MC version
   ↓
3. If "latest":
   ├─ Find latest Forge for latest MC
   └─ Filter by "recommended" tag
      ↓
4. Download Forge installer
   ↓
5. Run installer with --installServer
   ↓
6. Wait for installation to complete
   ↓
7. Verify installation success
```

### Server Property Customization

Users can customize server behavior through profiles and direct editing:

**Profile System**:
- Pre-configured templates for common scenarios
- Stored in `templates/profiles/*.yml`
- Applied during server.properties generation
- Users can create custom profiles

**Direct Editing**:
- Edit `server.properties` after generation
- Changes persist across restarts
- Not overwritten unless profile changed
- Validated on server startup by Minecraft

**Common Customizations**:
- `spawn-protection`: Area around spawn where only ops can build
- `max-players`: Maximum simultaneous players
- `view-distance`: Chunk render distance (affects performance)
- `difficulty`: Peaceful, Easy, Normal, Hard
- `gamemode`: Survival, Creative, Adventure, Spectator
- `pvp`: Enable/disable player vs player combat
- `enable-command-block`: Allow command blocks
- `whitelist`: Enable whitelist mode

---

## Type System

### Core TypeScript Interfaces

```typescript
// Configuration
interface LazyConfig {
  version: string;
  serverType: 'vanilla' | 'forge' | 'fabric' | 'paper';
  minecraftVersion: string;
  worldPath: string;
  isNewWorld: boolean;
  port: number;
  ramGB: number;
  profile: string;
  upnpEnabled: boolean;
  backupOnExit: boolean;
  javaPath?: string;
  eulaAccepted?: boolean;
  lastRun: string;
}

// System Information
interface SystemInfo {
  os: 'windows' | 'mac' | 'linux';
  osVersion: string;
  platform: string;
  arch: string;
  totalRAMGB: number;
  availableRAMGB: number;
  cpuCores: number;
  cpuThreads: number;
  cpuModel: string;
  diskSpaceGB: number;
  javaInstalled: boolean;
  javaVersion?: string;
}

// Network Information
interface NetworkInfo {
  lanIP: string;
  publicIP?: string;
  port: number;
  upnpSuccess: boolean;
  reachable: boolean;
  firewallConfigured: boolean;
}

// Server Status
interface ServerStatus {
  running: boolean;
  version: string;
  players: string[];
  playerCount: number;
  maxPlayers: number;
  uptime: number;
  memory: {
    used: number;
    max: number;
    percentage: number;
  };
  tps?: number;
  worldSize?: number;
}

// Backup Information
interface BackupInfo {
  filename: string;
  path: string;
  size: number;
  createdAt: Date;
}

// Validation Result
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Wizard Answers
interface WizardAnswers {
  mode?: string;
  serverType?: string;
  minecraftVersion?: string;
  worldChoice?: 'new' | 'existing';
  worldPath?: string;
  ramGB?: number;
  port?: number;
  profile?: string;
  upnp?: boolean;
  backup?: boolean;
}

// Paths
interface Paths {
  root: string;
  logs: string;
  backups: string;
  temp: string;
  server: string;
  world: string;
  config: string;
  eula: string;
  properties: string;
  serverJar: string;
}

// QR Code Info
interface QRCodeInfo {
  terminal: string;    // Terminal-rendered QR
  imagePath: string;   // Path to PNG file
  content: string;     // Encoded content (IP:PORT)
}

// Download Options
interface DownloadOptions {
  timeout?: number;
  retries?: number;
  checksum?: string;
  checksumAlgorithm?: 'sha256' | 'sha1' | 'md5';
  onProgress?: (progress: DownloadProgress) => void;
}

// Download Progress
interface DownloadProgress {
  downloaded: number;  // Bytes downloaded
  total: number;       // Total bytes
  percentage: number;  // 0-100
  speed: number;       // Bytes per second
}

// Exec Result
interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

// Setup Data
interface SetupData {
  config: LazyConfig;
  systemInfo: SystemInfo;
  networkInfo: NetworkInfo;
  timestamp: Date;
}
```

---

## Conclusion

LazyCraftLauncher is a comprehensive Minecraft server management solution that prioritizes automation, user experience, and cross-platform compatibility. The architecture is modular, allowing for easy maintenance and feature additions.

**Key Strengths**:
- **Complete Automation**: From Java installation to network configuration
- **Graceful Degradation**: Helpful fallbacks when automation fails
- **User-Friendly**: Snarky, personality-driven messages
- **Cross-Platform**: Windows, macOS, and Linux support
- **Extensible**: REST API for external integrations
- **Reliable**: Automatic backups and error handling

**Technology Highlights**:
- React-based TUI (Ink framework)
- TypeScript for type safety
- Modular architecture for maintainability
- Comprehensive error handling
- Extensive logging and reporting

This documentation serves as a complete technical reference for developers working on or integrating with LazyCraftLauncher.

---

**Project**: LazyCraftLauncher
**Version**: 1.0.0
**License**: MIT
**Repository**: https://github.com/zaydiscold/LazyCraftLauncher

For questions, issues, or contributions, please visit the GitHub repository.
