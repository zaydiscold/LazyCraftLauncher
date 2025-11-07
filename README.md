# LazyCraftLauncher

AHHHHHHHHHHHH
COME TO THE CHINESE PEPTIDE RAVE DEC 13


Cross-platform Minecraft server automation. Handles Java installation, network configuration, firewall rules, and port forwarding. You run a binary. It does the rest. No technical knowledge required, which is probably for the best.

## What It Does

**Server Provisioning**
- Downloads server JARs (Vanilla, Forge)
- Installs Java if you forgot to
- Accepts EULA because nobody reads it anyway
- Generates server.properties from templates

**Network Configuration**
- Attempts UPnP port forwarding (3 retries with verification)
- Configures OS firewall rules
- Tests port reachability from external networks
- Falls back to manual instructions when automation fails

**Data Management**
- Validates world folders (checks for level.dat, region directory)
- Automatic backups on shutdown (keeps last 7)
- Manual backup creation via dashboard or API

**Runtime**
- Launches server in managed subprocess
- Monitors memory usage and uptime
- Tracks player connections
- REST API on localhost:8765 for external tooling

**Supported Server Types**
- Vanilla (any version or "latest")
- Forge (automatic installer execution)
- Fabric and Paper (not implemented, PR welcome)

**Included Profiles**
- survival-default: Normal difficulty, PvP on, 16 block spawn protection
- creative-flat: Peaceful creative mode, flat world
- hardcore-minimal: Hard difficulty, one life, 4 block spawn protection

You can edit server.properties after generation. The launcher will not overwrite your changes unless you switch profiles.

## Implementation Status

Network automation, Java detection, server provisioning, backup system, and terminal UI are functional. Native executables and automated updates are pending. Technical details in CLAUDE.md.

## Installation

**From Source**
```bash
git clone https://github.com/zaydiscold/LazyCraftLauncher.git
cd LazyCraftLauncher
npm install
npm run dev
```

**Included Scripts**
```bash
# macOS
chmod +x LazyCraftLauncher.command
./LazyCraftLauncher.command

# Windows (run as Administrator for firewall config)
LazyCraftLauncher.bat
```

**NPM Global Install**
```bash
npm install -g lazycraft-launcher
lazycraft
```

Standalone executables are not yet packaged. Build from source for now.

## Usage

```bash
lazycraft              # Interactive setup wizard
lazycraft --quick      # Skip wizard, use saved config
lazycraft --api-only   # API server without TUI
lazycraft --help       # Help text
```

**First Run**
Setup wizard asks for server type, version, RAM allocation, port, and profile. Launcher downloads Java if needed, configures firewall, attempts UPnP, and starts server. Configuration saved to .lazycraft.yml for future quick launches.

**Existing Worlds**
Point the launcher at a folder containing level.dat and region/ directory. It validates structure before proceeding. Missing optional files (data/, playerdata/) trigger warnings but do not block startup.

## Configuration

Stored in .lazycraft.yml:

```yaml
version: 1.0.0
serverType: vanilla
minecraftVersion: latest
worldPath: ./world
port: 25565
ramGB: 4
profile: survival-default
upnpEnabled: true
backupOnExit: true
javaPath: ./jre/bin/java
eulaAccepted: true
lastRun: 2025-11-05T12:34:56.789Z
```

Edit manually or re-run setup wizard. Changes take effect on next launch.

## File Structure

```
backups/               # Last 7 backups, YYYYMMDD-HHMM.zip format
logs/                  # Server logs, rotated daily
world/                 # Minecraft world (level.dat, region/, data/, playerdata/)
server.jar             # Server executable
server.properties      # Minecraft server config
.lazycraft.yml         # Launcher config
.network-info.json     # Cached network state
setup-report.txt       # Initial setup summary
```

## Networking

**Automatic Setup**
1. Detects LAN and public IP
2. Attempts UPnP port mapping (3 retries, 10s timeout, verifies mapping)
3. Configures OS firewall (Windows netsh, macOS socketfilterfw, Linux iptables/ufw)
4. Tests port reachability via direct TCP connection

**When UPnP Fails**
Router does not support UPnP or has it disabled. Manual port forwarding required:
- Log into router (typically 192.168.1.1)
- Forward TCP port 25565 to your LAN IP
- Or enable UPnP in router settings and restart launcher

**Firewall Commands (if automation fails)**

Windows (Administrator):
```cmd
netsh advfirewall firewall add rule name="LazyCraftLauncher" dir=in action=allow protocol=TCP localport=25565
```

macOS:
```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /path/to/java
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock /path/to/java
```

Linux:
```bash
sudo iptables -A INPUT -p tcp --dport 25565 -j ACCEPT
# or
sudo ufw allow 25565/tcp
```

**Alternative: VPN**
Tailscale, ZeroTier, or Hamachi bypass port forwarding entirely. All players join same virtual network, use LAN address.

## Backups

Automatic on exit (if backupOnExit: true). Rolling 7-backup retention. Each ZIP contains world folder, server.properties, config files, ops/whitelist/ban lists.

Manual backup via dashboard or API:
```bash
curl -X POST http://127.0.0.1:8765/action/backup
```

Restore by extracting ZIP and copying world folder to active directory. Not rocket science.

## API

Runs on http://127.0.0.1:8765. Localhost only. No authentication.

```bash
# Server status
GET /status

# Configuration
GET /config

# Control
POST /action/start
POST /action/stop
POST /action/backup
```

Use for Discord bots, monitoring dashboards, or automated scripts. Returns JSON. Status is 200 for queries, 202 for actions.

## Troubleshooting

**Java Not Found**
Launcher downloads Temurin JRE automatically. If it fails, check internet connection or manually install Java 17/21 from Adoptium. Set javaPath in config.

**UPnP Failed**
Router does not support UPnP or disabled. Enable in router settings or manually forward port. Alternatively, use VPN (Tailscale/ZeroTier).

**Firewall Blocking**
Windows: Run as Administrator. macOS: Allow Java in firewall settings. Linux: Run firewall commands manually (see Networking section).

**World Validation Failed**
Folder missing level.dat or region/ directory. Point to valid Minecraft world or create new one.

**Port In Use**
Another server running on port 25565. Change port in wizard or kill other Java process.

**Server Crash on Start**
Check logs/server-YYYYMMDD.log for errors. Common causes: insufficient RAM (minimum 2GB), incompatible world version, corrupted world data.

**Low TPS / Lag**
Increase RAM allocation, reduce view-distance in server.properties, or close background programs. Paper server (when implemented) offers better performance than Vanilla.

## EULA

Launcher auto-accepts Mojang EULA (https://www.minecraft.net/en-us/eula) during setup. Acceptance logged in eula.txt and setup-report.txt. By using this software, you agree to the EULA.

## Development

Requires Node.js 18+.

```bash
git clone https://github.com/zaydiscold/LazyCraftLauncher.git
cd LazyCraftLauncher
npm install
npm run dev          # Development mode
npm run build        # Compile TypeScript
npm run launch       # Build + run
```

Packaging commands (pkg:win, pkg:mac, release) are defined but not yet functional.

**Architecture**

```
src/
├── main.ts              # Entry point
├── cli.tsx              # React Ink TUI
├── core/                # Business logic (server, network, backup, java, etc.)
├── platform/            # OS-specific firewall code (Windows/macOS)
├── ui/                  # Wizard and dashboard components
├── utils/               # Logging, paths, command execution
└── types/               # TypeScript definitions
```

**Tech Stack**
Node.js, TypeScript, React Ink, nat-api (UPnP), got (HTTP), fs-extra, adm-zip, execa.

See CLAUDE.md for implementation details.

## Roadmap

Fabric/Paper support, Discord webhooks, plugin management, cloud backups, self-updating binaries.

## License

MIT. See LICENSE file.

## Links

Repository: https://github.com/zaydiscold/LazyCraftLauncher
Issues: https://github.com/zaydiscold/LazyCraftLauncher/issues

---

**LazyCraftLauncher** - You ask play game, i make game for you.
