# LazyCraftLauncher

**"You ask play game , i make game for you."**

A cross-platform Minecraft server launcher with a lightweight Terminal User Interface (TUI) that automates everything needed to run a multiplayer Minecraft server. No technical expertise required—just drag, click, and play.

## Features

### Core Functionality
- **One-Click Setup**: Automated server configuration for Vanilla and Forge servers
- **Auto Java Detection**: Automatically downloads and installs Java (Temurin JRE) if not found
- **Interactive TUI**: Beautiful terminal interface built with React Ink
- **Quick Launch Mode**: Reuses saved configuration for instant server starts
- **Advanced Setup Wizard**: Guided configuration with sensible defaults
- **World Management**:
  - Create new worlds with customizable profiles
  - Import existing world folders with automatic validation
  - Validates `level.dat` and `region/` directory before accepting
- **Network Automation**:
  - Automatic UPnP port forwarding
  - Firewall configuration (Windows, Mac, Linux)
  - Public IP detection and port reachability testing
  - LAN and WAN address display with helpful connection tips
- **Backup System**:
  - Automatic backups on exit
  - Rolling 7-day retention policy
  - Manual backup creation anytime
  - Includes world data and all configuration files
- **Local API Server**: REST API on `127.0.0.1:8765` for external integrations
- **Real-time Monitoring**: Server status, player tracking, and uptime display

### Server Types
- **Vanilla**: Latest official Minecraft server (or specify version)
- **Forge**: Modded server support with automatic Forge installer
- **Fabric & Paper**: Coming soon (currently disabled)

### Game Profiles
Three pre-configured profiles to choose from:

1. **Survival Default**
   - Normal difficulty
   - Survival gamemode
   - PvP enabled
   - Spawn protection: 16 blocks

2. **Creative Flat**
   - Peaceful difficulty
   - Creative gamemode
   - Flat world generation
   - No PvP, no spawn protection

3. **Hardcore Minimal**
   - Hard difficulty
   - Hardcore mode (one life)
   - Survival gamemode
   - PvP enabled
   - Minimal spawn protection (4 blocks)

## Project Status

- ✅ Architecture, system detection, Java bootstrap, server provisioning (Vanilla + Forge), backup engine, network automation, and Ink dashboard are implemented.
- ✅ Profiles, server.properties templating, and the local API are wired up and functional.
- 🔄 Remaining polish: packaging into native executables, richer player/TPS telemetry, automated update checks, and expanded test coverage.
- 🧭 See `LazyCraftLauncher-Complete-Spec.md` for the complete roadmap and design decisions.

## Installation

### Prerequisites
- Node.js 18+ (for running from source or npm)
- OR download standalone executables (no Node.js required)

### Option 0: Included Launch Scripts

**macOS**
```bash
chmod +x LazyCraftLauncher.command
./LazyCraftLauncher.command
```

**Windows**
```
LazyCraftLauncher.bat
```

> Tip: Right-click and choose “Run as administrator” to allow automatic firewall configuration.

The helper script installs dependencies (on first run), builds the TypeScript sources, and launches the CLI.

### Option 1: NPM Global Install
```bash
npm install -g lazycraft-launcher
lazycraft
```

### Option 2: Standalone Executables
Download the latest release for your platform:

**Windows**: `LazyCraftLauncher.exe`
```bash
# Download and run
LazyCraftLauncher.exe
```

**macOS**: `LazyCraftLauncher` or `LazyCraftLauncher.app`
```bash
# Make executable and run
chmod +x LazyCraftLauncher
./LazyCraftLauncher
```

**Linux**: Build from source (see Development section)

### Option 3: Run from Source
```bash
# Clone repository
git clone https://github.com/zaydiscold/LazyCraftLauncher.git
cd LazyCraftLauncher

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the CLI
npm run build

# Launch compiled CLI
npm run start

# Build + run in one go
npm run launch
```

## Usage

### Quick Start

1. **First Launch**:
   ```bash
   lazycraft
   ```
   - The setup wizard will guide you through configuration
   - Choose server type (Vanilla/Forge)
   - Select or create a world
   - Configure RAM, port, and game profile
   - Launcher handles Java, firewall, UPnP automatically

2. **Subsequent Launches**:
   ```bash
   lazycraft --quick
   ```
   - Uses saved configuration for instant startup
   - No questions asked, just launches

3. **API-Only Mode**:
   ```bash
   lazycraft --api-only
   ```
   - Starts the local API server without the TUI
   - Useful for external control interfaces

### Command Line Arguments

```
lazycraft              # Launch interactive setup wizard
lazycraft --quick      # Quick launch with saved config
lazycraft --api-only   # Start API server only
lazycraft --help       # Show help message
```

### Using Existing World Folders

To use an existing Minecraft world:

1. Place your world folder next to the launcher executable
2. During setup, select "Use existing world folder"
3. Enter the path to your world (e.g., `./my-world`)
4. Launcher validates the world has required files:
   - `level.dat` (world data)
   - `region/` directory (world chunks)
   - Displays warnings for missing optional files

**Valid World Requirements**:
- Must contain `level.dat` file
- Must contain `region/` directory
- Optional but recommended: `data/`, `playerdata/`, `level.dat_old`

### Dashboard Controls

Once the server is running, the dashboard provides:

**Keyboard Shortcuts**:
- Arrow Keys: Navigate between actions
- Enter: Execute selected action
- Q or Esc: Stop server and quit

**Available Actions**:
- **Restart**: Gracefully restart the server
- **Backup**: Create immediate backup (saved to `backups/`)
- **Stop**: Stop server with automatic backup (if enabled)

**Display Panels**:
- **Status Panel**: Server state, version, uptime, memory usage
- **Address Panel**: LAN / public address summaries with connection tips
- **Network Status**:
  - Reachable banner: confirms friends can join from the internet
  - Local-only banner: offers port-forwarding and VPN tips

## Configuration

Configuration is saved in `.lazycraft.yml` in the launcher directory.

### Example Configuration
```yaml
version: 1.0.0
serverType: vanilla
minecraftVersion: latest
worldPath: ./world
isNewWorld: true
port: 25565
ramGB: 4
profile: survival-default
upnpEnabled: true
backupOnExit: true
javaPath: ./jre/bin/java
eulaAccepted: true
lastRun: 2025-11-05T12:34:56.789Z
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `serverType` | string | `vanilla` | Server type: `vanilla` or `forge` |
| `minecraftVersion` | string | `latest` | Minecraft version (e.g., `1.21.3`) |
| `worldPath` | string | `./world` | Path to world folder |
| `isNewWorld` | boolean | `true` | Create new world or use existing |
| `port` | number | `25565` | Server port (1024-65535) |
| `ramGB` | number | `2` | RAM allocation in GB |
| `profile` | string | `survival-default` | Game profile preset |
| `upnpEnabled` | boolean | `true` | Enable automatic port forwarding |
| `backupOnExit` | boolean | `true` | Auto-backup when stopping server |
| `javaPath` | string | - | Path to Java executable |

## File Structure

```
LazyCraftLauncher/
├── backups/              # Automatic backups (rolling 7-day retention)
│   ├── 20251105-1430.zip
│   ├── 20251104-1630.zip
│   └── ...
├── logs/                 # Server logs by date
│   ├── server-20251105.log
│   └── ...
├── .temp/                # Temporary files
├── .cache/               # Download cache
├── world/                # Minecraft world data
│   ├── level.dat
│   ├── region/
│   ├── data/
│   └── playerdata/
├── server.jar            # Minecraft server JAR
├── server.properties     # Server configuration
├── eula.txt              # EULA acceptance
├── .lazycraft.yml        # Launcher configuration
├── setup-report.txt      # Setup summary
└── .network-info.json    # Network configuration cache
```

## Networking & Port Forwarding

### Automatic Configuration

LazyCraftLauncher attempts to automatically configure your network:

1. **UPnP Port Forwarding**: Opens port on router automatically
2. **Firewall Rules**: Adds inbound rules for the server port
3. **Reachability Test**: Tests if port is accessible from internet

### Manual Port Forwarding

If automatic UPnP fails:

1. **Router Configuration**:
   - Open your router admin panel (usually `192.168.1.1`)
   - Navigate to Port Forwarding / Virtual Servers
   - Add rule: TCP port 25565 → your computer's local IP
   - Save and restart router

2. **Firewall (Manual)**:

   **Windows** (run as Administrator):
   ```cmd
   netsh advfirewall firewall add rule name="LazyCraftLauncher" dir=in action=allow protocol=TCP localport=25565
   ```

   **macOS**:
   - System Settings → Network → Firewall
   - Click “Options…” and unlock with your password
   - Add `/usr/bin/java` and set to “Allow incoming connections”

   **Linux** (iptables):
   ```bash
   sudo iptables -A INPUT -p tcp --dport 25565 -j ACCEPT
   ```

   Or (ufw):
   ```bash
   sudo ufw allow 25565/tcp
   ```

3. **Alternative: Tailscale**:
   - Install [Tailscale](https://tailscale.com) on host and players
   - No port forwarding needed
   - Secure peer-to-peer connection

## Backups

### Automatic Backups
- Created on server exit (if `backupOnExit: true`)
- Stored in `backups/` directory
- Rolling retention: keeps last 7 backups
- Filename format: `YYYYMMDD-HHMM.zip`

### Backup Contents
Each backup ZIP includes:
- Complete `world/` folder
- `server.properties`
- `.lazycraft.yml`
- `eula.txt`
- `ops.json`, `whitelist.json`
- `banned-players.json`, `banned-ips.json`

### Manual Backup
Press **B** key in dashboard or use API:
```bash
curl -X POST http://127.0.0.1:8765/action/backup
```

### Restore from Backup
```bash
# Extract backup manually
unzip backups/20251105-1430.zip

# Replace world folder
rm -rf world
mv extracted/world ./world

# Restore config files
cp extracted/server.properties ./
```

## Local API

REST API runs on `http://127.0.0.1:8765` (localhost only, no auth required).

### Endpoints

**GET /status**
```json
{
  "running": true,
  "version": "1.21.3",
  "players": ["Steve", "Alex"],
  "uptime": 3600,
  "memory": { "used": 2048, "max": 4096 },
  "port": 25565,
  "lanIP": "192.168.1.100",
  "publicIP": "203.0.113.50",
  "reachable": true
}
```

**GET /config**
```json
{
  "serverType": "vanilla",
  "minecraftVersion": "latest",
  "port": 25565,
  ...
}
```

**POST /action/start**
- Starts the server
- Returns: `202 Accepted` with operation ID

**POST /action/stop**
- Stops the server gracefully
- Returns: `202 Accepted` with operation ID

**POST /action/backup**
- Creates immediate backup
- Returns: `202 Accepted` with operation ID

## Troubleshooting

### Java Not Found
**Problem**: "No Java found" message

**Solution**: Launcher auto-downloads Java to `./jre/`. If this fails:
- Check internet connection
- Manually install Java 17 or 21 from [Adoptium](https://adoptium.net/)
- Set `javaPath` in `.lazycraft.yml`

### UPnP Failed
**Problem**: "UPnP failed. Your router said no."

**Solution**: Your router doesn't support UPnP or has it disabled
- Enable UPnP in router settings
- Or manually configure port forwarding (see Networking section)
- Or use Tailscale for peer-to-peer connection

### Firewall Blocking
**Problem**: Players can't connect, firewall rules failed

**Solution**:
- Windows: Run launcher as Administrator
- macOS: Allow Java in Security & Privacy settings
- Linux: Run firewall commands manually (see Networking section)

### World Validation Failed
**Problem**: "Invalid world folder. Missing level.dat."

**Solution**:
- Verify world folder is correct Minecraft world
- Check for `level.dat` and `region/` directory
- Don't use modded worlds with incompatible versions
- Try creating new world instead

### Port Already in Use
**Problem**: "Port 25565 already in use"

**Solution**:
- Another Minecraft server is running
- Change port in Advanced Setup (e.g., 25566)
- Or stop other server: `taskkill /F /IM java.exe` (Windows)

### Server Crashes on Start
**Problem**: Server starts then immediately stops

**Solution**:
- Check logs in `logs/server-YYYYMMDD.log`
- Increase RAM allocation (minimum 2GB recommended)
- Verify world compatibility with server version
- Delete `world/` to generate fresh world

### Low Performance
**Problem**: Server lag or low TPS

**Solution**:
- Increase RAM allocation in Advanced Setup
- Reduce view distance in `server.properties`
- Close resource-intensive programs
- Use `Paper` server for better performance (coming soon)

## Mojang EULA

This launcher automatically accepts the [Minecraft End User License Agreement](https://www.minecraft.net/en-us/eula) on your behalf during setup. By using this launcher, you agree to Mojang's EULA.

The EULA acceptance is logged in:
- `eula.txt` (standard Minecraft EULA file)
- `setup-report.txt` (includes timestamp of consent)

## Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Setup
```bash
# Clone repository
git clone https://github.com/zaydiscold/LazyCraftLauncher.git
cd LazyCraftLauncher

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Build
```bash
# Compile TypeScript
npm run build

# Package standalone executables
npm run pkg:win    # Windows .exe
npm run pkg:mac    # macOS binary
npm run release    # All platforms
```

### Project Structure
```
src/
├── main.ts                 # Entry point
├── cli.tsx                 # Main React Ink app
├── core/                   # Core functionality modules
│   ├── api.ts             # Local REST API server
│   ├── backup.ts          # Backup management
│   ├── config.ts          # Configuration handling
│   ├── detect.ts          # System detection
│   ├── downloads.ts       # Server JAR downloads
│   ├── eula.ts            # EULA handling
│   ├── java.ts            # Java detection/download
│   ├── network.ts         # Networking, UPnP, firewall
│   ├── props.ts           # server.properties generation
│   ├── qr.ts              # QR code generation
│   ├── report.ts          # Setup report generation
│   ├── run.ts             # Server execution
│   ├── serverJar.ts       # Server JAR management
│   ├── status.ts          # Server status monitoring
│   └── world.ts           # World validation
├── platform/              # Platform-specific code
│   ├── windows.ts         # Windows firewall
│   └── mac.ts             # macOS firewall
├── ui/                    # React Ink components
│   ├── Wizard.tsx         # Setup wizard
│   ├── Dashboard.tsx      # Server dashboard
│   └── components/        # Reusable UI components
├── utils/                 # Utility functions
│   ├── exec.ts           # Command execution
│   ├── log.ts            # Logging
│   └── paths.ts          # Path management
└── types/                 # TypeScript definitions
    └── index.ts
```

### Tech Stack
- **Runtime**: Node.js + TypeScript
- **UI**: React + Ink (TUI framework)
- **Networking**: `nat-api` (UPnP), `got` (HTTP)
- **File Handling**: `fs-extra`, `adm-zip`
- **Config**: `yaml`
- **Process Management**: `child_process`, `execa`
- **Packaging**: `pkg` for executables

## Technical Documentation

For detailed technical documentation, architecture diagrams, and implementation details, see [CLAUDE.md](./CLAUDE.md).

## Future Features

### Planned
- **Fabric & Paper Support**: Additional server types
- **Discord Webhooks**: Notifications for server events (start/stop, player joins)
- **Scheduled Events**: "Game Nights" mode with timed world events
- **Plugin Management**: Auto-download and update plugins
- **Auto-Updates**: Self-updating launcher
- **Cloud Backups**: S3/Dropbox integration

### Contributions
Contributions welcome! Please open issues for bugs or feature requests.

## License

MIT License - See LICENSE file for details

## Credits

Created by [zaydiscold](https://github.com/zaydiscold)

Built with:
- [Ink](https://github.com/vadimdemedes/ink) - React for CLIs
- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)

## Support

- **Issues**: [GitHub Issues](https://github.com/zaydiscold/LazyCraftLauncher/issues)
- **Discussions**: [GitHub Discussions](https://github.com/zaydiscold/LazyCraftLauncher/discussions)

---

**LazyCraftLauncher** - "You ask to play, we host for you."
