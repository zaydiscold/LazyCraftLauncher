/**
 * Dashboard for LazyCraft Launcher
 * Handles real-time server monitoring and control
 */

const Dashboard = {
    pollInterval: null,
    consoleLines: [],
    maxConsoleLines: 100,

    init() {
        this.attachEventListeners();
        this.startPolling();
        this.updateStatus(); // Initial update
    },

    attachEventListeners() {
        // Control buttons
        document.getElementById('btn-start').onclick = () => this.startServer();
        document.getElementById('btn-stop').onclick = () => this.stopServer();
        document.getElementById('btn-restart').onclick = () => this.restartServer();
        document.getElementById('btn-backup').onclick = () => this.createBackup();

        // Console command
        document.getElementById('console-send').onclick = () => this.sendCommand();
        document.getElementById('console-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendCommand();
            }
        });

        // Copy to clipboard for IPs
        document.querySelectorAll('.copyable').forEach(element => {
            element.onclick = () => {
                navigator.clipboard.writeText(element.textContent);
                const original = element.textContent;
                element.textContent = 'Copied!';
                setTimeout(() => {
                    element.textContent = original;
                }, 1000);
            };
        });
    },

    startPolling() {
        // Poll status every 3 seconds
        this.pollInterval = setInterval(() => {
            this.updateStatus();
        }, 3000);
    },

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    },

    async updateStatus() {
        try {
            const status = await API.getStatus();
            if (!status) return;

            this.updateStatusPanel(status);
            this.updateConnectionPanel(status);
            this.updatePlayerList(status);
            this.updateControlButtons(status);
            this.updateConsole(status);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    },

    updateStatusPanel(status) {
        const statusBadge = document.getElementById('server-status');
        const version = document.getElementById('server-version');
        const uptime = document.getElementById('server-uptime');
        const players = document.getElementById('server-players');
        const memory = document.getElementById('server-memory');
        const memoryBar = document.getElementById('memory-bar-fill');

        // Status badge
        statusBadge.textContent = status.running ? 'Running' : 'Stopped';
        statusBadge.className = `status-badge ${status.running ? 'running' : 'stopped'}`;

        // Version
        version.textContent = status.version || '-';

        // Uptime
        if (status.running && status.uptime) {
            uptime.textContent = this.formatUptime(status.uptime);
        } else {
            uptime.textContent = '-';
        }

        // Players
        players.textContent = `${status.playerCount || 0}/${status.maxPlayers || 0}`;

        // Memory
        if (status.memory) {
            const used = (status.memory.used / 1024).toFixed(1);
            const max = (status.memory.max / 1024).toFixed(1);
            memory.textContent = `${used}/${max}GB`;
            memoryBar.style.width = `${status.memory.percentage}%`;
        } else {
            memory.textContent = '-';
            memoryBar.style.width = '0%';
        }
    },

    updateConnectionPanel(status) {
        const lanIp = document.getElementById('lan-ip');
        const publicIp = document.getElementById('public-ip');
        const reachability = document.getElementById('reachability-status');

        lanIp.textContent = status.lanIP ? `${status.lanIP}:${status.port}` : '-';
        publicIp.textContent = status.publicIP ? `${status.publicIP}:${status.port}` : '-';

        // Reachability status
        if (status.reachable) {
            reachability.className = 'reachability-status reachable';
            reachability.innerHTML = `
                <span class="status-icon">✅</span>
                <span>Your friends can connect from anywhere!</span>
            `;
        } else if (status.running) {
            reachability.className = 'reachability-status unreachable';
            reachability.innerHTML = `
                <span class="status-icon">⚠️</span>
                <span>Local only. Try UPnP, port forwarding, or Tailscale</span>
            `;
        } else {
            reachability.className = 'reachability-status';
            reachability.innerHTML = `
                <span class="status-icon">⚠️</span>
                <span>Server not running</span>
            `;
        }
    },

    updatePlayerList(status) {
        const playerList = document.getElementById('player-list');

        if (!status.players || status.players.length === 0) {
            playerList.innerHTML = '<p class="empty-state">No players online</p>';
        } else {
            playerList.innerHTML = status.players
                .map(player => `<div class="player-item">${player}</div>`)
                .join('');
        }
    },

    updateControlButtons(status) {
        const startBtn = document.getElementById('btn-start');
        const stopBtn = document.getElementById('btn-stop');
        const restartBtn = document.getElementById('btn-restart');
        const consoleInput = document.getElementById('console-input');
        const consoleSend = document.getElementById('console-send');

        if (status.running) {
            startBtn.disabled = true;
            stopBtn.disabled = false;
            restartBtn.disabled = false;
            consoleInput.disabled = false;
            consoleSend.disabled = false;
        } else {
            startBtn.disabled = false;
            stopBtn.disabled = true;
            restartBtn.disabled = true;
            consoleInput.disabled = true;
            consoleSend.disabled = true;
        }
    },

    updateConsole(status) {
        // In a real implementation, we'd get logs from the API
        // For now, we'll just show status messages
        if (status.running && this.consoleLines.length === 1) {
            this.addConsoleLine('info', 'Server is running...');
            this.addConsoleLine('info', `Version: ${status.version}`);
            this.addConsoleLine('info', `Players: ${status.playerCount}/${status.maxPlayers}`);
        }
    },

    addConsoleLine(type, message) {
        this.consoleLines.push({ type, message, timestamp: new Date() });

        // Keep only last N lines
        if (this.consoleLines.length > this.maxConsoleLines) {
            this.consoleLines.shift();
        }

        this.renderConsole();
    },

    renderConsole() {
        const consoleOutput = document.getElementById('console-output');
        consoleOutput.innerHTML = this.consoleLines
            .map(line => `<div class="console-line ${line.type}">${line.message}</div>`)
            .join('');

        // Auto-scroll to bottom
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    },

    async startServer() {
        try {
            this.addConsoleLine('info', 'Starting server...');
            await API.startServer();
            this.addConsoleLine('info', 'Server start command sent!');
            setTimeout(() => this.updateStatus(), 1000);
        } catch (error) {
            this.addConsoleLine('error', `Failed to start server: ${error.message}`);
        }
    },

    async stopServer() {
        if (!confirm('Are you sure you want to stop the server?')) {
            return;
        }

        try {
            this.addConsoleLine('info', 'Stopping server...');
            await API.stopServer();
            this.addConsoleLine('info', 'Server stop command sent!');
            setTimeout(() => this.updateStatus(), 1000);
        } catch (error) {
            this.addConsoleLine('error', `Failed to stop server: ${error.message}`);
        }
    },

    async restartServer() {
        if (!confirm('Are you sure you want to restart the server?')) {
            return;
        }

        try {
            this.addConsoleLine('info', 'Restarting server...');
            await API.restartServer();
            this.addConsoleLine('info', 'Server restart command sent!');
            setTimeout(() => this.updateStatus(), 1000);
        } catch (error) {
            this.addConsoleLine('error', `Failed to restart server: ${error.message}`);
        }
    },

    async createBackup() {
        try {
            this.addConsoleLine('info', 'Creating backup...');
            const result = await API.createBackup();
            this.addConsoleLine('info', `Backup created: ${result.filename || 'success'}`);
        } catch (error) {
            this.addConsoleLine('error', `Failed to create backup: ${error.message}`);
        }
    },

    async sendCommand() {
        const input = document.getElementById('console-input');
        const command = input.value.trim();

        if (!command) return;

        try {
            this.addConsoleLine('info', `> ${command}`);
            await API.sendCommand(command);
            input.value = '';
        } catch (error) {
            this.addConsoleLine('error', `Failed to send command: ${error.message}`);
        }
    },

    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    },

    cleanup() {
        this.stopPolling();
    }
};
