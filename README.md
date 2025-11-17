# ⛏️ LazyCraft Launcher

> **"You ask to play, we host for you."**

A beautiful, web-based Minecraft server launcher that automates everything from Java installation to network configuration. Just click and play!

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4.4-blue)

---

## 🌟 Features

### 🎮 **Zero-Configuration Server Hosting**
- **Automatic Java Detection & Download** - No manual JDK installation needed
- **One-Click Server Setup** - Vanilla, Forge, Paper, and Fabric support
- **Intelligent Network Configuration** - UPnP port forwarding, firewall rules, IP detection
- **World Management** - Create new worlds or import existing ones
- **Automated Backups** - Keep your world safe with automatic backup retention (last 7)

### 🎨 **Stunning Nostalgia-Core Web Interface**
- **Minecraft-Themed Design** - Pixel fonts, blocky panels, and authentic retro vibes
- **Glassmorphism UI** - Modern frosted glass effects with backdrop blur
- **Smooth Animations** - 60fps animations, floating particles, and buttery transitions
- **Responsive Design** - Perfect on desktop, tablet, and mobile
- **Real-Time Dashboard** - Live server status, player monitoring, and console access
- **Dark Mode Native** - Easy on the eyes for those late-night gaming sessions

### ⚡ **Powerful Management**
- **Live Console** - Send commands and view output in real-time
- **Player Monitoring** - See who's online and track player activity
- **Memory Management** - Visual RAM usage with dynamic allocation
- **Port Configuration** - Easy port setup with reachability testing
- **Profile Presets** - Survival, Creative, and Hardcore configurations

### 🛡️ **Production Ready**
- **Cross-Platform** - Windows, macOS, and Linux support
- **REST API** - Full API for external integrations
- **Automatic Cleanup** - Graceful shutdown with server stop on exit
- **Error Handling** - Comprehensive error messages and recovery
- **Logging System** - Detailed logs for debugging and monitoring

---

## 📦 Installation

### Prerequisites

- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **Git** (optional, for cloning)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/zaydiscold/LazyCraftLauncher.git
cd LazyCraftLauncher

# Install dependencies
npm install

# Build the project
npm run build

# Launch LazyCraft!
npm start
```

Your browser will automatically open to `http://127.0.0.1:8765` with the LazyCraft interface! 🚀

---

## 🎯 Usage

### First Time Setup

1. **Launch LazyCraft**
   ```bash
   npm start
   ```

2. **Complete the Setup Wizard**
   - Choose your server type (Vanilla, Forge, Paper, Fabric)
   - Select Minecraft version
   - Configure world settings (new or existing)
   - Allocate RAM (with intelligent system detection)
   - Set server port (default: 25565)
   - Choose game profile (Survival, Creative, Hardcore)
   - Enable advanced options (UPnP, auto-backup)

3. **Launch Your Server!**
   - Review your configuration
   - Click "Launch Server 🚀"
   - Watch the magic happen!

### Dashboard Features

Once your server is running, you'll see the **LazyCraft Dashboard** with:

#### 📊 **Server Status Panel**
- Server state (Running/Stopped)
- Minecraft version
- Uptime tracker
- Player count
- Memory usage (with visual bar)

#### 🌐 **Connection Info Panel**
- LAN IP address (click to copy)
- Public IP address (click to copy)
- Port reachability status
- Network diagnostics

#### 👥 **Player List**
- Real-time player tracking
- Online player names
- Join/leave notifications

#### 🎛️ **Server Controls**
- **Start Server** - Launch your Minecraft server
- **Stop Server** - Graceful shutdown with backup
- **Restart** - Quick server restart
- **Backup** - Manual world backup

#### 📜 **Live Console**
- Real-time server output
- Color-coded messages (info/warn/error)
- Command input for server management
- Auto-scroll to latest messages

### Command Line Options

```bash
# Standard web UI mode (default)
npm start

# API-only mode (no browser, for headless servers)
npm start -- --api-only

# Show help
npm start -- --help
```

---

## 🎨 Web Interface Overview

### Design Philosophy

LazyCraft's interface combines **nostalgia-core aesthetics** with **modern web technology**:

- **Pixel-Perfect Typography** - Press Start 2P and VT323 fonts
- **Minecraft Color Palette** - Authentic grass green, dirt brown, diamond cyan
- **Glassmorphism Effects** - Frosted glass panels with backdrop blur
- **Animated Particles** - 8 floating blocks with glow effects
- **Smooth Transitions** - CSS animations for every interaction
- **Responsive Grid** - Adapts from mobile to 4K displays

### Technology Stack

**Frontend:**
- Vanilla JavaScript (ES6+)
- Tailwind CSS (CDN with custom config)
- HTML5 with semantic structure
- Custom CSS3 animations (7 unique keyframes)

**Backend:**
- Node.js + TypeScript
- Fastify (high-performance HTTP)
- REST API architecture
- YAML configuration

**Automation:**
- Platform-specific shell commands
- UPnP port mapping (nat-api)
- Java runtime management (Adoptium Temurin)
- File system operations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────┐                    ┌──────────────┐       │
│  │  main.ts     │────────────────────│  API Server  │       │
│  │  (Entry)     │  Starts & Manages  │  (Fastify)   │       │
│  └──────────────┘                    └──────┬───────┘       │
│                                              │                │
│                                      Serves Static Files     │
└──────────────────────────────────────────────┼──────────────┘
                                               │
┌──────────────────────────────────────────────┼──────────────┐
│                 Web UI Layer (Browser)                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ index.html │  │ style.css  │  │ JavaScript │            │
│  │ (Tailwind) │  │ (Nostalgia)│  │ (Vanilla)  │            │
│  └────────────┘  └────────────┘  └──────┬─────┘            │
│                                          │                    │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐          │
│  │ wizard.js  │  │dashboard.js│  │    api.js    │          │
│  │ (Setup)    │  │ (Monitor)  │  │  (Client)    │          │
│  └────────────┘  └────────────┘  └──────────────┘          │
└───────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼─────────────────────────────────┐
│              Core Business Logic Layer                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │ backup │ │ config │ │network │ │  world │ │   run  │    │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │  java  │ │download│ │serverJar│ │  eula  │ │ status │    │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │
└───────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼─────────────────────────────────┐
│           Platform & Utility Layer                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                │
│  │ detect │ │  paths │ │   log  │ │  exec  │                │
│  └────────┘ └────────┘ └────────┘ └────────┘                │
└───────────────────────────────────────────────────────────────┘
```

### REST API Endpoints

#### Server Management
- `GET /status` - Get current server status
- `POST /action/start` - Start Minecraft server
- `POST /action/stop` - Stop server gracefully
- `POST /action/restart` - Restart server
- `POST /action/backup` - Create backup

#### Configuration
- `GET /config` - Get current configuration
- `POST /config` - Save configuration
- `GET /system` - Get system information

#### Console
- `POST /command` - Send command to server console

#### Health
- `GET /health` - API health check

---

## ⚙️ Configuration

LazyCraft uses a YAML configuration file (`.lazycraft.yml`) for persistence:

```yaml
version: 1.0.0
serverType: vanilla          # vanilla | forge | fabric | paper
minecraftVersion: latest     # Version string or "latest"
worldPath: ./world           # Path to world folder
isNewWorld: true             # Create new vs. use existing
port: 25565                  # Server port (1024-65535)
ramGB: 4                     # RAM allocation in GB
profile: survival-default    # Game profile preset
upnpEnabled: true            # Attempt UPnP port forwarding
backupOnExit: true           # Auto-backup on shutdown
eulaAccepted: true           # EULA consent flag
lastRun: 2025-11-17T12:00:00Z
```

### Profile Presets

**Survival Default** (`survival-default`)
- Default survival mode
- Normal difficulty
- Standard world generation
- PvP enabled
- 16 block spawn protection

**Creative Flat** (`creative-flat`)
- Creative mode
- Flat world type
- Peaceful difficulty
- Flight enabled

**Hardcore Minimal** (`hardcore-minimal`)
- Hardcore mode (one life)
- Hard difficulty
- Minimal world generation
- 4 block spawn protection

---

## 🔧 Development

### Project Structure

```
LazyCraftLauncher/
├── src/                      # TypeScript source code
│   ├── core/                 # Core business logic
│   │   ├── api.ts           # REST API server
│   │   ├── backup.ts        # Backup management
│   │   ├── config.ts        # Configuration handling
│   │   ├── detect.ts        # System detection
│   │   ├── java.ts          # Java runtime management
│   │   ├── network.ts       # Network configuration
│   │   ├── run.ts           # Server process management
│   │   └── status.ts        # Status monitoring
│   ├── utils/               # Utility functions
│   │   ├── exec.ts          # Command execution
│   │   ├── log.ts           # Logging system
│   │   └── paths.ts         # Path management
│   ├── types/               # TypeScript type definitions
│   └── main.ts              # Application entry point
├── web/                      # Web UI files (served by API)
│   ├── css/
│   │   └── style.css        # Nostalgia-core styles (700+ lines)
│   ├── js/
│   │   ├── api.js           # API client
│   │   ├── app.js           # Main application
│   │   ├── dashboard.js     # Dashboard logic
│   │   └── wizard.js        # Setup wizard
│   └── index.html           # Main HTML (Tailwind integrated)
├── dist/                     # Compiled JavaScript (generated)
├── logs/                     # Application logs
├── backups/                  # World backups
├── package.json
├── tsconfig.json
├── CLAUDE.md                 # Technical documentation
└── README.md
```

### Build & Development

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Run in development mode (with auto-rebuild)
npm run dev

# Clean build directory
npm run clean

# Full rebuild
npm run launch
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  }
}
```

---

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**
```
Error: Port 8765 is already in use
```
**Solution:** Stop other applications using port 8765, or change the port in `src/core/api.ts`

**Java Not Found**
```
Error: Java runtime not found
```
**Solution:** LazyCraft will automatically download Java 21 from Adoptium. If this fails, manually install from [Adoptium](https://adoptium.net/)

**UPnP Port Forwarding Failed**
```
Warning: UPnP port mapping failed
```
**Solution:** Manually configure port forwarding on your router for port 25565, or enable UPnP in router settings

**Server Won't Start**
```
Error: Server failed to start
```
**Solution:** Check logs in `logs/` directory. Common causes:
- Insufficient RAM allocated (minimum 2GB)
- Port already in use
- Corrupted server JAR (delete and re-download)
- Firewall blocking Java

**Web UI Won't Load**
```
Browser shows "Cannot connect"
```
**Solution:**
- Ensure API server started (check console output)
- Try manually visiting `http://127.0.0.1:8765`
- Check firewall settings
- Clear browser cache
- Use Chrome, Firefox, or Edge (modern browsers)

### Manual Firewall Configuration

If automatic firewall setup fails:

**Windows** (Run as Administrator):
```cmd
netsh advfirewall firewall add rule name="LazyCraftLauncher" dir=in action=allow protocol=TCP localport=25565
```

**macOS**:
```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/bin/java
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock /usr/bin/java
```

**Linux**:
```bash
# Using iptables
sudo iptables -A INPUT -p tcp --dport 25565 -j ACCEPT

# Or using ufw
sudo ufw allow 25565/tcp
```

### Debug Mode

Enable detailed logging:

```bash
# View logs
cat logs/lazycraft-*.log

# Watch logs in real-time
tail -f logs/lazycraft-*.log
```

---

## 🌐 Networking

### Automatic Setup

LazyCraft automatically configures your network:

1. **Detects LAN and Public IP** - Identifies your local and external addresses
2. **UPnP Port Mapping** - Attempts automatic router configuration (3 retries)
3. **Firewall Configuration** - Adds OS-specific firewall rules
4. **Reachability Test** - Tests port accessibility from the internet

### When UPnP Fails

If automatic port forwarding fails, you have options:

**Option 1: Manual Port Forwarding**
1. Log into your router (typically `192.168.1.1` or `192.168.0.1`)
2. Find "Port Forwarding" or "Virtual Server" settings
3. Forward TCP port 25565 to your LAN IP address

**Option 2: Enable UPnP**
1. Log into your router
2. Enable UPnP in settings
3. Restart LazyCraft

**Option 3: Use a VPN**
- **Tailscale** - Free, easy setup, recommended
- **ZeroTier** - Alternative free option
- **Hamachi** - Classic choice (limited free tier)

All players join the same virtual network and use LAN addresses (no port forwarding needed!)

---

## 💾 Backups

### Automatic Backups

- Triggered on server shutdown (if `backupOnExit: true`)
- Rolling 7-backup retention (oldest deleted automatically)
- Each backup includes:
  - World folder (level.dat, region/, data/, playerdata/)
  - server.properties
  - Configuration files
  - Ops, whitelist, and ban lists

### Manual Backups

**Via Dashboard:**
- Click the "💾 Backup" button

**Via API:**
```bash
curl -X POST http://127.0.0.1:8765/action/backup
```

### Restore from Backup

1. Stop the server
2. Extract the backup ZIP file
3. Copy the world folder to your server directory
4. Restart the server

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Reporting Bugs

Open an issue with:
- LazyCraft version
- Operating system
- Node.js version
- Steps to reproduce
- Expected vs actual behavior
- Log files (if applicable)

### Feature Requests

We'd love to hear your ideas! Open an issue describing:
- The feature you'd like
- Why it would be useful
- How it might work

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License - Copyright (c) 2025 LazyCraft Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

- **Minecraft** by Mojang Studios - The game that inspired this project
- **Adoptium** - For providing free, high-quality Java runtimes
- **Tailwind CSS** - For the amazing utility-first CSS framework
- **Fastify** - For the blazing-fast web framework
- **TypeScript** - For making JavaScript development a joy

---

## 🎮 Quick Tips

**For Best Experience:**
- Use Chrome, Firefox, or Edge (modern browsers)
- Allocate at least 4GB RAM for vanilla servers
- Enable UPnP for automatic port forwarding
- Create backups before major changes
- Share your Public IP with friends to let them join

**Performance Tips:**
- Close unnecessary applications
- Use SSD storage for world files
- Allocate maximum 80% of total system RAM
- Use Paper for better performance (when available)
- Enable backup on exit for safety

**Multiplayer Tips:**
- Give friends your Public IP + Port number
- Check reachability status (green = accessible!)
- Use port 25565 for standard Minecraft
- Consider Tailscale for easy LAN-over-internet
- Use whitelist feature for security

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/zaydiscold/LazyCraftLauncher/issues)
- **Discussions:** [GitHub Discussions](https://github.com/zaydiscold/LazyCraftLauncher/discussions)
- **Documentation:** [CLAUDE.md](CLAUDE.md) - Comprehensive technical docs

---

## 🎯 Roadmap

- [ ] Fabric and Paper server support
- [ ] Plugin management system
- [ ] Discord webhooks for server events
- [ ] Cloud backup integration
- [ ] Mobile app (React Native)
- [ ] Self-updating binaries
- [ ] Multi-server management
- [ ] Performance monitoring graphs

---

<div align="center">

## ⛏️ **Happy Mining!** ⛏️

**Built with ❤️ for the Minecraft community**

**LazyCraftLauncher** - *You ask to play, we host for you.*

[⬆ Back to Top](#-lazycraft-launcher)

</div>
