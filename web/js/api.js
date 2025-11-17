/**
 * API Client for LazyCraft Launcher
 * Handles all communication with the backend API
 */

const API = {
    BASE_URL: 'http://localhost:8765',

    /**
     * Get current server status
     */
    async getStatus() {
        try {
            const response = await fetch(`${this.BASE_URL}/status`);
            if (!response.ok) throw new Error('Failed to fetch status');
            return await response.json();
        } catch (error) {
            console.error('Error fetching status:', error);
            return null;
        }
    },

    /**
     * Get current configuration
     */
    async getConfig() {
        try {
            const response = await fetch(`${this.BASE_URL}/config`);
            if (!response.ok) throw new Error('Failed to fetch config');
            return await response.json();
        } catch (error) {
            console.error('Error fetching config:', error);
            return null;
        }
    },

    /**
     * Start the server
     */
    async startServer() {
        try {
            const response = await fetch(`${this.BASE_URL}/action/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to start server');
            return await response.json();
        } catch (error) {
            console.error('Error starting server:', error);
            throw error;
        }
    },

    /**
     * Stop the server
     */
    async stopServer() {
        try {
            const response = await fetch(`${this.BASE_URL}/action/stop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to stop server');
            return await response.json();
        } catch (error) {
            console.error('Error stopping server:', error);
            throw error;
        }
    },

    /**
     * Restart the server
     */
    async restartServer() {
        try {
            const response = await fetch(`${this.BASE_URL}/action/restart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to restart server');
            return await response.json();
        } catch (error) {
            console.error('Error restarting server:', error);
            throw error;
        }
    },

    /**
     * Create a backup
     */
    async createBackup() {
        try {
            const response = await fetch(`${this.BASE_URL}/action/backup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to create backup');
            return await response.json();
        } catch (error) {
            console.error('Error creating backup:', error);
            throw error;
        }
    },

    /**
     * Send a command to the server console
     */
    async sendCommand(command) {
        try {
            const response = await fetch(`${this.BASE_URL}/command`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ command })
            });
            if (!response.ok) throw new Error('Failed to send command');
            return await response.json();
        } catch (error) {
            console.error('Error sending command:', error);
            throw error;
        }
    },

    /**
     * Get system information
     */
    async getSystemInfo() {
        try {
            const response = await fetch(`${this.BASE_URL}/system`);
            if (!response.ok) throw new Error('Failed to fetch system info');
            return await response.json();
        } catch (error) {
            console.error('Error fetching system info:', error);
            return null;
        }
    },

    /**
     * Save configuration (for wizard)
     */
    async saveConfig(config) {
        try {
            const response = await fetch(`${this.BASE_URL}/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });
            if (!response.ok) throw new Error('Failed to save config');
            return await response.json();
        } catch (error) {
            console.error('Error saving config:', error);
            throw error;
        }
    }
};
