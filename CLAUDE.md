# LazyCraftLauncher - Technical Documentation

This document provides comprehensive technical documentation for the LazyCraftLauncher codebase, explaining the architecture, how each component works, the data flow, and implementation details.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Application Entry Points](#application-entry-points)
4. [Web User Interface](#web-user-interface)
5. [Core Systems](#core-systems)
6. [Platform-Specific Implementations](#platform-specific-implementations)
7. [Utility Systems](#utility-systems)
8. [Data Flow and Lifecycles](#data-flow-and-lifecycles)
9. [Configuration and State Management](#configuration-and-state-management)
10. [Network Architecture](#network-architecture)
11. [Server Management](#server-management)
12. [Type System](#type-system)

---

## Project Overview

**LazyCraftLauncher** is a web-based application built on Node.js that completely automates the setup, configuration, and management of Minecraft multiplayer servers. The project eliminates technical barriers by handling every aspect of server hosting—from Java runtime installation to network configuration to automated backups.

### Core Philosophy

The launcher is built around the principle of **zero-configuration automation with graceful degradation**. Every technical task is automated, but when automation fails (due to permissions, network restrictions, or platform limitations), the system provides clear, actionable manual instructions rather than failing silently.

### Design Principles

1. **Automation First**: Every manual step in traditional server setup is automated
2. **Graceful Degradation**: Failures result in helpful instructions, not crashes
3. **Cross-Platform Consistency**: Same experience on Windows, macOS, and Linux
4. **User-Friendly Interface**: Retro Minecraft-themed web UI with personality
5. **Stateful Persistence**: All configurations saved for quick re-launches
6. **REST API Architecture**: Clean separation between frontend and backend

---

## Architecture

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                             │
│  ┌──────────────┐                       ┌──────────────┐        │
│  │  main.ts     │───────────────────────│  API Server  │        │
│  │  (Entry)     │   Starts & Manages    │  (Fastify)   │        │
│  └──────────────┘                       └──────┬───────┘        │
│                                                 │                 │
│                                         Serves Static Files      │
└─────────────────────────────────────────────────┼─────────────────┘
                                                  │
┌─────────────────────────────────────────────────┼─────────────────┐
│                    Web UI Layer (Browser)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  index.html  │  │   style.css  │  │  JavaScript  │           │
│  │  (Structure) │  │  (MC Theme)  │  │  (Logic)     │           │
│  └──────────────┘  └──────────────┘  └──────┬───────┘           │
│                                              │                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  wizard.js   │  │dashboard.js  │  │    api.js    │           │
│  │  (Setup)     │  │ (Monitor)    │  │  (Fetch)     │           │
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
3. **API Server Launch**: Starts Fastify REST API server on port 8765
4. **Browser Launch**: Automatically opens web UI in default browser
5. **Process Management**: Keeps server alive and handles graceful shutdown

**Command-Line Modes**:

```bash
# Standard web UI mode (default)
lazycraft

# API-only mode (no browser launch)
lazycraft --api-only

# Help display
lazycraft --help
```

**Error Handling**:
- Global `uncaughtException` and `unhandledRejection` handlers
- All errors logged to file and displayed to user
- Graceful shutdown on critical failures
- Automatic Minecraft server cleanup on exit

**Key Responsibilities**:
- Process lifecycle management
- Directory structure initialization
- API server startup
- Browser launching
- Signal handling (SIGINT, SIGTERM, SIGHUP, SIGQUIT)

---

## Web User Interface

### Overview

The web UI provides a nostalgic Minecraft-themed interface accessible via browser at `http://127.0.0.1:8765`. Built with vanilla JavaScript, HTML5, and CSS3, it offers a lightweight, responsive experience without heavy frameworks.

### Design System

**Visual Theme**:
- **Font**: Press Start 2P (pixel-perfect retro font)
- **Color Palette**:
  - Grass Green: `#7cb342`
  - Dirt Brown: `#8d6e63`
  - Stone Gray: `#757575`
  - Coal Black: `#212121`
  - Diamond Cyan: `#00bcd4`
  - Redstone Red: `#d32f2f`
  - Emerald Green: `#00c853`
  - Gold Yellow: `#ffb300`

**UI Patterns**:
- Blocky panels with thick borders
- Box shadows for depth (Minecraft block style)
- Progress bars styled like health/hunger bars
- Monospace fonts for technical data
- Hover effects with subtle transforms

### File Structure

```
web/
├── index.html           # Main HTML structure
├── css/
│   └── style.css        # Minecraft-themed stylesheet
└── js/
    ├── api.js           # API client wrapper
    ├── wizard.js        # Setup wizard logic
    ├── dashboard.js     # Dashboard monitoring
    └── app.js           # Main app controller
```

### Setup Wizard (`wizard.js`)

Multi-step configuration flow that guides users through server setup.

**Steps**:

1. **Server Type**: Choose Vanilla, Forge, Paper, or Fabric
2. **Minecraft Version**: Specify version or use "latest"
3. **World Setup**: Create new world or use existing
4. **World Path**: (Conditional) Path to existing world folder
5. **RAM Allocation**: Memory allocation with system detection
6. **Port Configuration**: Server port (default 25565)
7. **Game Profile**: Survival, Creative, or Hardcore presets
8. **Advanced Options**: UPnP and backup settings
9. **Confirmation**: Review configuration before launch

**Features**:
- Visual progress bar showing completion
- Real-time validation with error messages
- Dynamic step flow (conditional steps)
- Click-based selection for options
- Text input for paths and values
- Configuration save via API

**Wizard State Management**:
```javascript
{
  currentStep: 0,
  answers: {
    serverType: 'vanilla',
    minecraftVersion: 'latest',
    worldChoice: 'new',
    ramGB: 4,
    port: 25565,
    profile: 'survival-default',
    upnpEnabled: true,
    backupOnExit: true
  },
  systemInfo: {...}
}
```

### Dashboard (`dashboard.js`)

Real-time server monitoring and control interface.

**Panels**:

1. **Status Panel**:
   - Server state (Running/Stopped)
   - Minecraft version
   - Uptime (formatted)
   - Player count
   - Memory usage with visual bar
   - TPS (ticks per second)

2. **Connection Panel**:
   - LAN IP address with port
   - Public IP address with port
   - Reachability status indicator
   - Click-to-copy functionality

3. **Player List**:
   - Online players (real-time)
   - Empty state message

4. **Control Panel**:
   - Start Server button
   - Stop Server button (with confirmation)
   - Restart button (with confirmation)
   - Backup button

5. **Console Panel**:
   - Live server output
   - Command input field
   - Send command button

**Real-Time Updates**:
- Polls `/status` endpoint every 3 seconds
- Updates all panels dynamically
- Auto-scroll console to bottom
- Color-coded console messages (info/warn/error)

**User Interactions**:
- Start/Stop/Restart with button states
- Manual backup creation
- Console command execution
- IP address copying to clipboard

### API Client (`api.js`)

JavaScript wrapper for backend API communication.

**Methods**:

```javascript
API.getStatus()           // Get server status
API.getConfig()           // Get saved configuration
API.getSystemInfo()       // Get system information
API.saveConfig(config)    // Save configuration
API.startServer()         // Start Minecraft server
API.stopServer()          // Stop server gracefully
API.restartServer()       // Restart server
API.createBackup()        // Create world backup
API.sendCommand(cmd)      // Send console command
```

**Error Handling**:
- Try-catch on all requests
- Console logging for debugging
- Returns null on failure (graceful)
- HTTP error code handling

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

- `loadConfig()`: Reads `.lazycraft.yml` from working directory
- `saveConfig()`: Serializes and writes configuration atomically
- `validateConfig()`: Validates schema and field constraints
- Default values for missing fields

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

Uses `nat-api` library to discover router and create port mapping:
- Protocol: TCP
- Public Port: User-specified (default 25565)
- Private Port: Same as public (1:1 mapping)
- Description: "LazyCraftLauncher Minecraft Server"
- TTL: 0 (permanent until router reboot)
- Safe cleanup with existence checks

**Firewall Configuration**:

**Windows**:
```bash
netsh advfirewall firewall add rule name="LazyCraftLauncher" dir=in action=allow protocol=TCP localport=25565
```

**macOS**:
```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/bin/java
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock /usr/bin/java
```

**Linux**:
```bash
# Try iptables first
sudo iptables -A INPUT -p tcp --dport 25565 -j ACCEPT

# Fallback to ufw
sudo ufw allow 25565/tcp
```

**Port Reachability Testing**:

```typescript
async function testPortReachability(publicIP: string, port: number): Promise<boolean>
```

- Uses external service `https://portchecker.io` API
- Tests port from outside the local network
- Called 5 seconds after server starts
- Returns boolean result for UI display

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
2. Queries Adoptium API endpoints
3. Parses JSON response for download URL
4. Shows progress during download
5. Extracts archive (tar.gz for Unix, zip for Windows)
6. Sets executable permissions on Unix systems
7. Locates Java binary using platform-specific search
8. Returns path to Java binary

---

### Server JAR Management (`serverJar.ts`)

Downloads and manages Minecraft server JARs for different server types.

**Server Type Resolution**:

**Vanilla Server**:
1. Fetches version manifest from Mojang
2. Resolves "latest" to current release version
3. Downloads server JAR from Mojang CDN
4. Verifies SHA256 checksum
5. Creates symlink to active version

**Forge Server**:
1. Fetches Forge versions from files.minecraftforge.net
2. Downloads Forge installer JAR
3. Runs installer in headless mode
4. Downloads required libraries
5. Creates forge server launcher

**Paper/Fabric**: Planned implementations

---

### API Server (`api.ts`)

REST API for frontend communication and external integrations.

**Server Configuration**:
- Framework: Fastify (high-performance HTTP server)
- Host: `127.0.0.1` (localhost only - security)
- Port: `8765`
- CORS: Disabled (local only)
- Auth: None required (local access only)
- Static File Serving: `/web` directory

**Security**:
- IP whitelist: Only 127.0.0.1, ::1, 127.x.x.x
- 403 Forbidden for non-local requests

**Endpoints**:

**GET /status**
Returns current server status:
```json
{
  "success": true,
  "data": {
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
    "reachable": true
  }
}
```

**GET /config**
Returns current configuration

**POST /config**
Saves configuration from wizard

**GET /system**
Returns system information (RAM, CPU, OS, etc.)

**POST /action/start**
Starts the server (202 Accepted, async)

**POST /action/stop**
Stops the server gracefully (202 Accepted, async)

**POST /action/restart**
Restarts the server (202 Accepted, async)

**POST /action/backup**
Creates immediate backup (202 Accepted, async)

**POST /command**
Sends console command to server:
```json
{
  "command": "say Hello world"
}
```

**GET /health**
Health check endpoint

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
4. Start API server (Fastify)
   ↓
5. Register API endpoints
   ↓
6. Serve static web UI files
   ↓
7. Open browser to http://127.0.0.1:8765
   ↓
8. Web UI loads in browser
   ↓
9. JavaScript fetches /config endpoint
   ↓
10. Determine mode:
    ├─ Has config → Show dashboard with Quick Launch
    └─ No config → Show setup wizard
       ↓
11. User completes wizard OR clicks Quick Launch
    ↓
12. POST /config (if new setup)
    ↓
13. POST /action/start
    ↓
14. Server setup sequence:
    ├─ Ensure Java
    ├─ Download server JAR
    ├─ Accept EULA
    ├─ Configure network
    ├─ Generate properties
    └─ Start server
       ↓
15. Dashboard polls /status every 3 seconds
    ↓
16. Real-time updates displayed
```

### Server Startup Lifecycle

```
1. POST /action/start received
   ↓
2. Load configuration
   ↓
3. Verify server.jar exists
   ↓
4. Construct Java command
   ↓
5. Spawn Java process
   ↓
6. Pipe stdout/stderr to log file
   ↓
7. Server initialization begins
   ↓
8. Server loads world
   ↓
9. Server binds to port
   ↓
10. Server logs "Done" message
    ↓
11. onServerReady() triggered
    ↓
12. Test port reachability
    ↓
13. Update network info
    ↓
14. Server running (accept connections)
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

**Quick Launch Logic**:
```javascript
if (savedConfig exists) {
  Show dashboard with config
  Enable "Quick Launch" button
} else {
  Show setup wizard
}
```

---

## Type System

### Core TypeScript Interfaces

```typescript
export interface LazyConfig {
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

export interface SystemInfo {
  os: 'windows' | 'mac' | 'linux';
  platform: string;
  arch: string;
  totalRAMGB: number;
  availableRAMGB: number;
  javaInstalled: boolean;
  javaVersion?: string;
}

export interface NetworkInfo {
  lanIP: string;
  publicIP?: string;
  port: number;
  upnpSuccess: boolean;
  reachable: boolean;
}

export interface ServerStatus {
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
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

---

## Conclusion

LazyCraftLauncher is a streamlined, web-based Minecraft server management solution that prioritizes automation, user experience, and cross-platform compatibility. The architecture separates frontend (web UI) from backend (Node.js API), enabling clean modularity and future extensibility.

**Key Strengths**:
- **Complete Automation**: From Java installation to network configuration
- **Web-Based Interface**: Accessible, nostalgic Minecraft theme
- **Graceful Degradation**: Helpful fallbacks when automation fails
- **Cross-Platform**: Windows, macOS, and Linux support
- **REST API**: Clean separation enables future integrations
- **Lightweight**: Vanilla JavaScript, no heavy frameworks

**Technology Stack**:
- **Backend**: Node.js, TypeScript, Fastify
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Data**: YAML configuration, JSON API responses
- **Automation**: Platform-specific shell commands, UPnP, REST APIs

This documentation serves as a complete technical reference for developers working on or integrating with LazyCraftLauncher.

---

**Project**: LazyCraftLauncher
**Version**: 0.1.0
**License**: MIT
**Repository**: https://github.com/zaydiscold/LazyCraftLauncher

For questions, issues, or contributions, please visit the GitHub repository.
