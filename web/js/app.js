/**
 * Main Application Controller
 * Orchestrates the entire UI flow
 */

const App = {
    currentScreen: null,
    config: null,
    systemInfo: null,

    async init() {
        console.log('Initializing LazyCraft Launcher...');

        // Show loading screen
        this.showScreen('loading-screen');

        // Wait a moment for dramatic effect
        await this.sleep(1500);

        try {
            // Fetch system info
            this.systemInfo = await API.getSystemInfo();

            // Check if config exists
            this.config = await API.getConfig();

            if (this.config && this.config.serverType) {
                // Config exists - go straight to dashboard
                console.log('Config found, showing dashboard');
                this.showDashboard();
            } else {
                // No config - show wizard
                console.log('No config found, showing wizard');
                this.showWizard();
            }
        } catch (error) {
            console.error('Error during initialization:', error);
            this.showError('Failed to initialize application. Is the server running?');
        }
    },

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }
    },

    showWizard() {
        this.showScreen('wizard-screen');
        Wizard.init(this.systemInfo);
    },

    showDashboard() {
        this.showScreen('dashboard-screen');
        Dashboard.init();
    },

    showError(message) {
        // For now, just use alert
        // In production, you'd show a nice error screen
        alert(message);
        console.error(message);
    },

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Make App available globally for other modules
window.app = App;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
