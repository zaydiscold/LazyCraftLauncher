/**
 * Setup Wizard for LazyCraft Launcher
 * Handles the multi-step configuration process
 */

const Wizard = {
    currentStep: 0,
    answers: {},
    systemInfo: null,

    steps: [
        {
            id: 'serverType',
            title: 'Choose Server Type',
            render: () => `
                <p class="mb-10">What type of server do you want to run?</p>
                <div class="option-grid">
                    <div class="option-card" data-value="vanilla">
                        <h4>⛏️ Vanilla</h4>
                        <p>Pure Minecraft experience</p>
                    </div>
                    <div class="option-card" data-value="forge">
                        <h4>🔧 Forge</h4>
                        <p>Mods and customization</p>
                    </div>
                    <div class="option-card" data-value="paper">
                        <h4>📜 Paper</h4>
                        <p>Performance optimized</p>
                    </div>
                </div>
            `,
            validate: () => !!Wizard.answers.serverType
        },
        {
            id: 'version',
            title: 'Minecraft Version',
            render: () => `
                <div class="form-group">
                    <label>What version do you want to run?</label>
                    <input type="text" id="version-input" placeholder="latest" value="latest">
                    <p class="text-secondary mt-10" style="font-size: 7px;">
                        Examples: "latest", "1.21.3", "1.20.1"
                    </p>
                </div>
            `,
            validate: () => {
                const input = document.getElementById('version-input');
                Wizard.answers.minecraftVersion = input.value || 'latest';
                return true;
            }
        },
        {
            id: 'world',
            title: 'World Setup',
            render: () => `
                <p class="mb-10">Do you want to create a new world or use an existing one?</p>
                <div class="option-grid">
                    <div class="option-card" data-value="new">
                        <h4>🌍 New World</h4>
                        <p>Generate a fresh world</p>
                    </div>
                    <div class="option-card" data-value="existing">
                        <h4>📁 Existing World</h4>
                        <p>Use a world folder</p>
                    </div>
                </div>
                <div id="world-path-container" class="hidden mt-10">
                    <div class="form-group">
                        <label>World folder path:</label>
                        <input type="text" id="world-path-input" placeholder="./world">
                    </div>
                </div>
            `,
            validate: () => {
                if (Wizard.answers.worldChoice === 'existing') {
                    const input = document.getElementById('world-path-input');
                    Wizard.answers.worldPath = input.value || './world';
                } else {
                    Wizard.answers.isNewWorld = true;
                    Wizard.answers.worldPath = './world';
                }
                return !!Wizard.answers.worldChoice;
            }
        },
        {
            id: 'ram',
            title: 'RAM Allocation',
            render: () => {
                const maxRam = Wizard.systemInfo ? Math.floor(Wizard.systemInfo.totalRAMGB * 0.8) : 4;
                return `
                    <div class="form-group">
                        <label>How much RAM to allocate? (GB)</label>
                        <input type="number" id="ram-input" min="1" max="${maxRam}" value="4">
                        <p class="text-secondary mt-10" style="font-size: 7px;">
                            System RAM: ${Wizard.systemInfo?.totalRAMGB || '?'}GB | Recommended max: ${maxRam}GB
                        </p>
                    </div>
                `;
            },
            validate: () => {
                const input = document.getElementById('ram-input');
                const ram = parseInt(input.value);
                if (ram < 1 || isNaN(ram)) {
                    alert('RAM must be at least 1GB');
                    return false;
                }
                Wizard.answers.ramGB = ram;
                return true;
            }
        },
        {
            id: 'port',
            title: 'Server Port',
            render: () => `
                <div class="form-group">
                    <label>What port should the server run on?</label>
                    <input type="number" id="port-input" min="1024" max="65535" value="25565">
                    <p class="text-secondary mt-10" style="font-size: 7px;">
                        Default Minecraft port is 25565
                    </p>
                </div>
            `,
            validate: () => {
                const input = document.getElementById('port-input');
                const port = parseInt(input.value);
                if (port < 1024 || port > 65535 || isNaN(port)) {
                    alert('Port must be between 1024 and 65535');
                    return false;
                }
                Wizard.answers.port = port;
                return true;
            }
        },
        {
            id: 'profile',
            title: 'Game Profile',
            render: () => `
                <p class="mb-10">Choose a game profile preset:</p>
                <div class="option-grid">
                    <div class="option-card" data-value="survival-default">
                        <h4>⚔️ Survival</h4>
                        <p>Default survival mode</p>
                    </div>
                    <div class="option-card" data-value="creative-flat">
                        <h4>🎨 Creative</h4>
                        <p>Flat world, creative mode</p>
                    </div>
                    <div class="option-card" data-value="hardcore-minimal">
                        <h4>💀 Hardcore</h4>
                        <p>One life, hard difficulty</p>
                    </div>
                </div>
            `,
            validate: () => !!Wizard.answers.profile
        },
        {
            id: 'advanced',
            title: 'Advanced Options',
            render: () => `
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="upnp-checkbox" checked>
                        Enable UPnP (automatic port forwarding)
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="backup-checkbox" checked>
                        Backup world on server stop
                    </label>
                </div>
            `,
            validate: () => {
                Wizard.answers.upnpEnabled = document.getElementById('upnp-checkbox').checked;
                Wizard.answers.backupOnExit = document.getElementById('backup-checkbox').checked;
                return true;
            }
        },
        {
            id: 'confirm',
            title: 'Confirm Setup',
            render: () => {
                return `
                    <div class="status-content">
                        <h3 style="margin-bottom: 15px;">Review Your Configuration:</h3>
                        <div class="status-row">
                            <span class="label">Server Type:</span>
                            <span>${Wizard.answers.serverType || 'N/A'}</span>
                        </div>
                        <div class="status-row">
                            <span class="label">Version:</span>
                            <span>${Wizard.answers.minecraftVersion || 'N/A'}</span>
                        </div>
                        <div class="status-row">
                            <span class="label">World:</span>
                            <span>${Wizard.answers.worldChoice === 'new' ? 'New World' : Wizard.answers.worldPath}</span>
                        </div>
                        <div class="status-row">
                            <span class="label">RAM:</span>
                            <span>${Wizard.answers.ramGB || 'N/A'}GB</span>
                        </div>
                        <div class="status-row">
                            <span class="label">Port:</span>
                            <span>${Wizard.answers.port || 'N/A'}</span>
                        </div>
                        <div class="status-row">
                            <span class="label">Profile:</span>
                            <span>${Wizard.answers.profile || 'N/A'}</span>
                        </div>
                        <div class="status-row">
                            <span class="label">UPnP:</span>
                            <span>${Wizard.answers.upnpEnabled ? '✓ Enabled' : '✗ Disabled'}</span>
                        </div>
                        <div class="status-row">
                            <span class="label">Auto Backup:</span>
                            <span>${Wizard.answers.backupOnExit ? '✓ Enabled' : '✗ Disabled'}</span>
                        </div>
                    </div>
                    <p class="mt-10 text-center" style="color: var(--gold-yellow);">
                        Ready to launch your server?
                    </p>
                `;
            },
            validate: () => true
        }
    ],

    init(systemInfo) {
        this.systemInfo = systemInfo;
        this.currentStep = 0;
        this.answers = {};
        this.render();
        this.attachEventListeners();
    },

    render() {
        const step = this.steps[this.currentStep];
        const content = document.getElementById('wizard-content');
        const title = document.getElementById('wizard-title');
        const backBtn = document.getElementById('wizard-back');
        const nextBtn = document.getElementById('wizard-next');
        const progress = document.getElementById('wizard-progress');

        title.textContent = step.title;
        content.innerHTML = step.render();

        // Update buttons
        backBtn.style.display = this.currentStep > 0 ? 'inline-block' : 'none';
        nextBtn.textContent = this.currentStep === this.steps.length - 1 ? 'Launch Server! 🚀' : 'Next →';

        // Update progress bar
        const progressPercent = ((this.currentStep + 1) / this.steps.length) * 100;
        progress.style.width = `${progressPercent}%`;

        // Re-attach listeners for dynamic content
        this.attachStepListeners();
    },

    attachEventListeners() {
        const nextBtn = document.getElementById('wizard-next');
        const backBtn = document.getElementById('wizard-back');

        nextBtn.onclick = () => this.next();
        backBtn.onclick = () => this.previous();
    },

    attachStepListeners() {
        const step = this.steps[this.currentStep];

        // Handle option card selection
        if (['serverType', 'world', 'profile'].includes(step.id)) {
            const cards = document.querySelectorAll('.option-card');
            cards.forEach(card => {
                card.onclick = () => {
                    cards.forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');

                    if (step.id === 'world' && card.dataset.value === 'existing') {
                        document.getElementById('world-path-container').classList.remove('hidden');
                    } else if (step.id === 'world') {
                        document.getElementById('world-path-container').classList.add('hidden');
                    }

                    if (step.id === 'serverType') {
                        this.answers.serverType = card.dataset.value;
                    } else if (step.id === 'world') {
                        this.answers.worldChoice = card.dataset.value;
                    } else if (step.id === 'profile') {
                        this.answers.profile = card.dataset.value;
                    }
                };
            });
        }
    },

    async next() {
        const step = this.steps[this.currentStep];

        if (!step.validate()) {
            return;
        }

        if (this.currentStep === this.steps.length - 1) {
            // Final step - launch server
            await this.complete();
        } else {
            this.currentStep++;
            this.render();
        }
    },

    previous() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.render();
        }
    },

    async complete() {
        // Convert wizard answers to config format
        const config = {
            version: '1.0.0',
            serverType: this.answers.serverType,
            minecraftVersion: this.answers.minecraftVersion,
            worldPath: this.answers.worldPath,
            isNewWorld: this.answers.worldChoice === 'new',
            port: this.answers.port,
            ramGB: this.answers.ramGB,
            profile: this.answers.profile,
            upnpEnabled: this.answers.upnpEnabled,
            backupOnExit: this.answers.backupOnExit,
            eulaAccepted: true,
            lastRun: new Date().toISOString()
        };

        try {
            // Save config via API
            await API.saveConfig(config);

            // Start the server setup process
            await API.startServer();

            // Switch to dashboard
            window.app.showDashboard();
        } catch (error) {
            console.error('Error completing wizard:', error);
            alert('Failed to save configuration. Check console for details.');
        }
    }
};
