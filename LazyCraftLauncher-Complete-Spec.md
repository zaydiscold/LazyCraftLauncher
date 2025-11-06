# LazyCraftLauncher - Complete Implementation Specification

You are generating a cross-platform Minecraft server "lazy launcher" with a lightweight UI for non-technical users. Project codename: LazyCraftLauncher.

## GOAL
Build a Node.js app with a simple guided UI (TUI using `ink`) that lets users drag in a world folder or start new, click once, answer a few questions, and get a working multiplayer Minecraft server on Windows and macOS. Automate everything: Java, server jar, firewall, UPnP, backups, run/stop. Default to one-click success.

## IMPLEMENTATION SNAPSHOT (current repo)
- ✅ Implemented: system detection, Java bootstrap, vanilla & Forge provisioning, world validation, backup engine, Ink wizard/dashboard, local API, server status aggregation, firewall/UPnP automation (with elevation detection), handlebars-based server.properties templating, and platform helper utilities.
- ✅ Added ready-to-run scripts (`LazyCraftLauncher.command` / `.bat`), templated game profiles, and documentation on launch flow.
- 🔄 Outstanding: native packaging/release artifacts, richer telemetry (TPS, memory per player), automated self-update manifest flow, deeper API coverage, and comprehensive test suites.
- 🗺️ QR code sharing has been removed in favor of textual connection helpers per latest requirements.

## SCOPE AND CHOICES
- **Interface**: Lightweight TUI using React-based `ink` framework. Color, spinners, panels, keybindings. Provide a simple dashboard after setup with Start/Stop, Status, Players Online, IP/Port highlights.
- **Runtime**: Node.js + TypeScript. Package into standalone executables for Windows and Mac. Also publish as npm global. Provide scripts to build for Linux later.
- **Worlds**: Support both new world generation and loading an existing `world/` folder dropped next to the app. **Validate world folders** by checking for `level.dat`, `region/` directory, and other essential files before accepting.
- **Multiplayer**: Target external multiplayer. Attempt automatic UPnP on chosen port. Show LAN IP regardless. Expose public address if reachable.
- **Modes**: Quick Launch reuses saved config, asks nothing. Advanced Setup asks all questions.
- **Persistence**: Save prior answers in `.lazycraft.yml` and reuse in Quick Launch.

## SERVER CAPABILITIES
- **First-class server types**: Vanilla, Forge. (Fabric and others stubbed for future but disabled in UI.)
- **Mods**: For Forge, only prepare `mods/` folder. Do not auto-download mods. Users drag their mod files in.
- **Version handling**: Auto-suggest "latest recommended" for chosen type/version. Allow manual override.
  - **Vanilla**: Use latest release version (not snapshot)
  - **Forge**: Latest stable Forge for latest MC release version
- **EULA**: Auto-agree on behalf of user after clearly displaying the EULA URL once and logging consent in `eula.txt` and `setup-report.txt`.
- **RAM**: Ask user for RAM in GB. Validate against system RAM and cap with safety margin.
- **Profiles**: Provide 3 presets the user can pick in Advanced Setup:
  1. **Survival Default**: normal difficulty, gamemode=survival, spawn-protection=16, pvp=true
  2. **Creative Flat**: peaceful difficulty, gamemode=creative, spawn-protection=0, level-type=flat, pvp=false
  3. **Hardcore Minimal**: hard difficulty, hardcore=true, gamemode=survival, spawn-protection=4, pvp=true
- **Multiworld**: Not supported. One world per folder.

## AUTOMATION BEHAVIOR
- **Java**: Detect Java 17 or 21. If missing, auto-download and unpack Adoptium Temurin JRE into `./jre/` and pin to that path. Never require system install.
- **UPnP**: Attempt automatic mapping for TCP on selected port. On failure, still run LAN and display fallback instructions.
- **Firewall**: Auto add inbound rule where possible.
  - **Windows**: `netsh advfirewall firewall add rule name="LazyCraftLauncher" dir=in action=allow protocol=TCP localport={port}`
  - **macOS**: **Try automation first** with `socketfilterfw` by prompting for sudo password once during setup. If automation fails or is blocked by SIP, print exact allow instructions and prompt user to approve in Security & Privacy after first listen.
- **Port test**: After server starts, run an external reachability test using `https://portchecker.io` API and show result banner:
  - Success: "Your friends can connect."
  - Failure: "Local only. Use Tailscale or fix router port forward."
- **Backups**: On exit, zip `world/` and key configs into `backups/` with a rolling retention of 7 backups. Name format: `YYYYMMDD-HHMM.zip`.
- **Auto-update server jar**: Disabled by default. Provide manual "Update" button that backs up world before replacing jar. Confirm with user.
- **Local JSON API**: Start a local HTTP server on `127.0.0.1:8765` exposing `GET /status` (players, TPS if visible, uptime, memory, port, version), `GET /config`, `POST /action/{start|stop|backup}`. CORS disabled. For local UI usage only.

## DISTRIBUTION
- **Targets**: Windows and Mac first. Build scripts present for Linux but not primary.
- **Shipping formats**: 
  1. GitHub Releases with standalone binaries
  2. npm global install `npm i -g lazycraft-launcher`
  3. Direct links to executables
- **Executable naming**:
  - Windows: `LazyCraftLauncher.exe`
  - Mac: `LazyCraftLauncher.app` bundle (or `LazyCraftLauncher` binary if bundle not feasible)
- **Java bundling**: One-click experience by auto-downloading JRE on first run into local `./jre/` cache. Subsequent runs are offline.
- **App self-update**: Provide "Check for updates" that fetches a signed manifest and offers download of a new release. Do not auto-patch running binary.
- **Share info**: Display LAN/public connection tips and copyable addresses in the dashboard; QR flow cut per updated scope. Explore Minecraft deep links later if possible.

## UI/UX AND PERSONALITY
- Start with ASCII art header and a little snark. Example:

```
===================================
   LAZY CRAFT LAUNCHER
   "You ask to play, we host for you."
===================================
```

- **Colored prompts, spinners, progress bars**. Keep punchy copy.
- **Humor**: light, a bit mean, never abusive. Examples:
  - "No Java found. Classic. Sit tight, I'll fetch it."
  - "UPnP failed. Your router is a brick. You still get LAN."
  - "EULA time. You never read these. I did for you."
- Save a `setup-report.txt` summarizing:
  - Server type/version
  - RAM
  - Port and reachability result
  - LAN IP and public connection status summary
  - World path
  - EULA consent timestamp
- **Logs**: Minimal by default. Server stdout to `logs/server-YYYYMMDD.log`. Launcher log only on error.

## SECURITY AND PERMISSIONS
- Only remote calls allowed: official Mojang and Forge endpoints for downloads, `portchecker.io` for port testing, and optional update manifest. Everything else local.
- **Sandbox**: Operate entirely within the app folder. Do not write to system directories unless required by OS service helpers.
- **Firewall rule name**: "LazyCraftLauncher".
- Do not prompt for internet exposure confirmation. Proceed automatically, but clearly display a banner when public exposure is active.

## FUTURE EXPANSIONS TO FUTURE-PROOF
- "Game Nights" mode: A scheduler that enables timed world events, scoreboard, and pre-backup.
- Discord webhooks: Announce server start/stop, player join/leave, backup complete.
- Design code with pluggable "event bus" so these features can subscribe later.

## TECH STACK AND PACKAGES
- **Language**: TypeScript
- **CLI/UI**: `ink`, `ink-text-input`, `ink-select-input`
- **UX**: `gradient-string`
- **FS/Config**: `fs-extra`, `yaml`, `adm-zip`, `handlebars`
- **Networking**: `got`, `nat-api`, `https://portchecker.io`
- **Process**: `execa`
- **Packaging**: `tsc` via npm scripts today (native bundles later)
- **OS helpers**: Node `os` + light platform helper modules
- **Local API**: `fastify`

## FILE LAYOUT
```
Root
├── /src
│   ├── main.ts                // entrypoint, routes commands or UI
│   ├── cli.tsx                // ink app entry
│   ├── /ui
│   │   ├── Wizard.tsx         // ink TUI wizard component
│   │   ├── Dashboard.tsx      // status + buttons + connection tips
│   │   ├── components/
│   │   │   ├── Banner.tsx
│   │   │   ├── StatusPanel.tsx
│   │   │   ├── AddressPanel.tsx
│   │   │   └── ActionButtons.tsx
│   │   └── theme.ts           // colors, styling constants
│   ├── /core
│   │   ├── detect.ts          // OS, RAM, Java detection
│   │   ├── java.ts            // ensureTemurin(), path resolving
│   │   ├── downloads.ts       // generic download helpers + checksum
│   │   ├── serverJar.ts       // provision vanilla/forge jars + properties
│   │   ├── eula.ts            // show link, write eula.txt
│   │   ├── config.ts          // read/write .lazycraft.yml
│   │   ├── world.ts           // new vs existing, validation (level.dat, region/)
│   │   ├── network.ts         // UPnP, port test, firewall rules
│   │   ├── run.ts             // start/stop server, capture logs
│   │   ├── backup.ts          // zip world on exit, retention=7
│   │   ├── report.ts          // setup-report.txt
│   │   ├── status.ts          // poll server console for ready msg, parse
│   │   └── api.ts             // local JSON API on 127.0.0.1:8765
│   ├── /platform
│   │   ├── windows.ts         // netsh rules
│   │   └── mac.ts             // socketfilterfw with sudo prompt
│   ├── /utils
│   │   ├── exec.ts
│   │   ├── paths.ts
│   │   └── log.ts
│   └── /types
│       └── index.ts           // TypeScript interfaces
├── /templates
│   ├── server.properties.hbs
│   └── /profiles
│       ├── survival-default.yml
│       ├── creative-flat.yml
│       └── hardcore-minimal.yml
├── /assets
│   └── ascii.txt
├── package.json
├── tsconfig.json
└── README.md
```

## COMMANDS AND UI FLOWS

### 1) Quick Launch
- Load `.lazycraft.yml` if present. If missing, fall back to Wizard.
- Ensure Java. If absent, auto-download Temurin JRE into `./jre/`.
- Ensure server jar for chosen type/version. If missing, fetch latest recommended for that type.
- Attempt UPnP on chosen port.
- Add firewall rule or print exact command/instructions.
- If Windows elevation not detected, prompt user to rerun with Administrator rights before attempting auto firewall.
- Start server with `java -Xms{X}G -Xmx{Y}G -jar server.jar nogui`.
- Watch logs for "Done" line. Then render dashboard with connection summary. Minimal snark line.

### 2) Advanced Setup Wizard (ink TUI)
- Select **Server Type**: Vanilla or Forge
- **Version**: default selection "Latest Recommended" with option to type a version
- **EULA**: show URL and "I consent" checkbox; record timestamp; still set eula=true as requested
- **RAM**: ask user in GB; default to 4 GB or 1/3 of total
- **Port**: default 25565; validate not in use
- **Public exposure**: implicit yes; note in summary
- **World**: pick "Use existing folder" (with validation for level.dat, region/) or "Start new"
- **Profile**: choose from 3 presets; apply server.properties defaults
- **Summary screen**: show everything, Start button

### 3) Dashboard (ink TUI)
- **Panels**: Status (Starting/Running/Stopping), Players Online, Memory/TPS if available
- **Addresses**: LAN IP, Public IP, Port, reachability tips
- **Buttons/Hotkeys**: [S]tart, S[t]op, [B]ackup, [R]estart, [O]pen folder, [Q]uit
- **Footer line**: "UPnP status: ok/failed. Firewall: added/manual."
- On Quit, perform world save and backup zip.

## DOWNLOADING JARS

### Vanilla
- Use Mojang version manifest (`https://launchermeta.mojang.com/mc/game/version_manifest_v2.json`) to resolve the latest release version.
- Download server jar directly to `./server.jar`, recording SHA-1 in metadata for reuse.

### Forge
- Download Forge server jar if available; otherwise fetch installer from the Forge Maven.
- Run installer with `--installServer` in-place when needed, then promote the produced `forge-*-server.jar` to `./server.jar`.
- Persist metadata with Minecraft + Forge version identifiers.

## SERVER.PROPERTIES TEMPLATE KEYS
Generate from profiles with these keys:
- motd
- online-mode
- max-players
- difficulty
- gamemode
- view-distance
- simulation-distance
- pvp
- whitelist
- spawn-protection
- server-port
- hardcore (for Hardcore profile)
- level-type (for Creative Flat profile)

## WORLD VALIDATION
When user selects "Use existing folder", validate:
- `level.dat` exists
- `region/` directory exists
- Optional: Check `level.dat` is valid NBT format
- If validation fails, show error and prompt to select different folder or start new

## MINIMAL LOGIC FOR REACHABILITY
- After server is "Done", fetch public IP via `https://api.ipify.org`.
- Test reachability on selected port using `https://portchecker.io` API or similar.
- Render green "Your friends can connect" if reachable. Otherwise, show yellow warning with three tips: UPnP toggle in router, manual port forward, or Tailscale.

## BACKUPS
- On exit, zip `world/` and:
  - `server.properties`
  - `.lazycraft.yml`
  - `eula.txt`
- Keep last 7 zips. Delete older.
- Name format: `backups/YYYYMMDD-HHMM.zip`

## LOCAL API
- `GET /status` → `{ running: bool, version: string, players: string[], uptime: number, memory: {used: number, max: number}, port: number, lanIP: string, publicIP: string, reachable: bool }`
- `GET /config` → current `.lazycraft.yml` config
- `POST /action/start` → start server, return 202 with operation id
- `POST /action/stop` → stop server, return 202 with operation id
- `POST /action/backup` → backup world, return 202 with operation id
- Only bind `127.0.0.1:8765`. No auth needed.

## PACKAGE.JSON SCRIPTS
```json
{
  "scripts": {
    "dev": "tsx src/main.ts",
    "build": "tsup src/main.ts --format cjs --target node18",
    "pkg:win": "pkg dist/main.js -t node18-win-x64 --output dist/LazyCraftLauncher.exe",
    "pkg:mac": "pkg dist/main.js -t node18-macos-x64 --output dist/LazyCraftLauncher",
    "release": "npm run build && npm run pkg:win && npm run pkg:mac"
  }
}
```

## README CONTENT TO GENERATE
Include:
- One-paragraph pitch
- Quickstart for Windows/Mac
- Drag-and-drop world instructions with validation requirements
- How Quick Launch vs Advanced Setup works
- Port forwarding explanation
- Backup location and retention
- Troubleshooting (UPnP fail, firewall fail, Java path, world validation fail)
- Legal note about Mojang EULA and that you consented in setup

## TONE AND COPY EXAMPLES
- Java fetch: "No Java found. Predictable. Fetching a JRE so you don't have to Google it."
- UPnP fail: "Your router said no. You still get LAN. Try manually forwarding 25565 or use Tailscale."
- Start success: "Server is up. Try not to blow up the spawn this time."
- Backup: "Saved your world. You're welcome."
- World validation fail: "That's not a valid Minecraft world. Missing level.dat. Try again."
- Mac firewall prompt: "Need sudo to add firewall rule. Don't worry, it's just for port 25565."

## TESTING
- Add a smoke test that launches a vanilla 1.21.x server in a temp dir, waits for a "Done" log line, then shuts down, confirming `setup-report.txt` and a backup zip on exit.
- Test world validation with both valid and invalid folders.

## DELIVERABLES
Generate complete, production-ready code including:

1. **Full TypeScript sources** as per file layout above with:
   - Properly typed interfaces in `/types/index.ts`
   - Comprehensive JSDoc comments
   - Error handling for all external calls
   - Graceful degradation when automation fails

2. **Working Windows and Mac build scripts** in `package.json`

3. **Functional ink-based TUI** with:
   - Wizard component for setup
   - Dashboard component for server management
   - Proper keybindings and navigation
   - Responsive layout

4. **Complete README.md** with:
   - Installation instructions
   - Usage guide
   - Troubleshooting section
   - Screenshots/ASCII examples

5. **GitHub Actions workflow** for releases with:
   - Build for Windows and Mac
   - Automated version bumping
   - Release artifact upload

6. **Profile templates** (3 YAML files) with sensible defaults

7. **Sample `.lazycraft.yml`** config file

## IMPLEMENTATION NOTES

### Forge Installation
Use the `--installServer` approach:
```bash
java -jar forge-installer.jar --installServer
```
This creates the forge server jar and required libraries automatically.

### Mac Firewall Automation
```typescript
// Attempt with sudo prompt first
try {
  await execa('sudo', ['socketfilterfw', '--add', '/path/to/java']);
} catch (error) {
  // Fall back to instructions if automation fails
  showManualFirewallInstructions();
}
```

### Port Checking
```typescript
// Use portchecker.io API
const response = await got(`https://portchecker.io/check?host=${publicIP}&port=${port}`);
const isOpen = response.body.includes('open') || response.body.includes('reachable');
```

### World Validation
```typescript
async function validateWorld(worldPath: string): Promise<boolean> {
  const levelDat = path.join(worldPath, 'level.dat');
  const regionDir = path.join(worldPath, 'region');
  
  return await fs.pathExists(levelDat) && await fs.pathExists(regionDir);
}
```

## FINAL NOTES
- Implement this exactly as specified
- If any API or platform call requires elevation or cannot be automated on Mac, produce clear fallback instructions in the UI instead of failing
- All user-facing strings should match the snarky, helpful tone
- Prioritize working over perfect - automation can fail gracefully
- Generate ALL files needed for a complete, shippable application
- Include proper TypeScript types throughout
- Handle errors gracefully with user-friendly messages
- Make it actually work end-to-end

This is a complete specification. Generate the entire working application with all files, proper structure, and production-ready code.
