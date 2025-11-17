/**
 * Setup Wizard for LazyCraft Launcher - Tailwind Enhanced
 * Handles the multi-step configuration process with smooth animations
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
                <p class="text-gray-300 mb-8 text-lg pixel-text-small">What type of server do you want to run?</p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="option-card" data-value="vanilla">
                        <div class="text-4xl mb-4">⛏️</div>
                        <h4>Vanilla</h4>
                        <p>Pure Minecraft experience</p>
                    </div>
                    <div class="option-card" data-value="forge">
                        <div class="text-4xl mb-4">🔧</div>
                        <h4>Forge</h4>
                        <p>Mods and customization</p>
                    </div>
                    <div class="option-card" data-value="paper">
                        <div class="text-4xl mb-4">📜</div>
                        <h4>Paper</h4>
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
                <div class="space-y-4">
                    <label class="block text-gray-300 text-sm pixel-text-small">
                        What version do you want to run?
                    </label>
                    <input
                        type="text"
                        id="version-input"
                        class="w-full bg-mc-coal/50 px-4 py-3 rounded-xl text-white font-mono border-2 border-mc-stone/50 focus:border-mc-grass focus:outline-none transition-colors"
                        placeholder="latest"
                        value="latest"
                    />
                    <p class="text-gray-500 text-sm pixel-text-small">
                        💡 Examples: "latest", "1.21.3", "1.20.1"
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
                <p class="text-gray-300 mb-8 text-lg pixel-text-small">Do you want to create a new world or use an existing one?</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div class="option-card" data-value="new">
                        <div class="text-4xl mb-4">🌍</div>
                        <h4>New World</h4>
                        <p>Generate a fresh world</p>
                    </div>
                    <div class="option-card" data-value="existing">
                        <div class="text-4xl mb-4">📁</div>
                        <h4>Existing World</h4>
                        <p>Use a world folder</p>
                    </div>
                </div>
                <div id="world-path-container" class="hidden space-y-4 animate-slide-up">
                    <label class="block text-gray-300 text-sm pixel-text-small">
                        World folder path:
                    </label>
                    <input
                        type="text"
                        id="world-path-input"
                        class="w-full bg-mc-coal/50 px-4 py-3 rounded-xl text-white font-mono border-2 border-mc-stone/50 focus:border-mc-grass focus:outline-none transition-colors"
                        placeholder="./world"
                    />
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
                    <div class="space-y-4">
                        <label class="block text-gray-300 text-sm pixel-text-small">
                            How much RAM to allocate? (GB)
                        </label>
                        <input
                            type="number"
                            id="ram-input"
                            class="w-full bg-mc-coal/50 px-4 py-3 rounded-xl text-white font-mono text-2xl text-center border-2 border-mc-stone/50 focus:border-mc-grass focus:outline-none transition-colors"
                            min="1"
                            max="${maxRam}"
                            value="4"
                        />
                        <div class="bg-mc-coal/30 px-4 py-3 rounded-lg border border-mc-stone/30">
                            <p class="text-gray-400 text-sm pixel-text-small">
                                💻 System RAM: <span class="text-mc-diamond">${Wizard.systemInfo?.totalRAMGB || '?'}GB</span> |
                                Recommended max: <span class="text-mc-grass">${maxRam}GB</span>
                            </p>
                        </div>
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
                <div class="space-y-4">
                    <label class="block text-gray-300 text-sm pixel-text-small">
                        What port should the server run on?
                    </label>
                    <input
                        type="number"
                        id="port-input"
                        class="w-full bg-mc-coal/50 px-4 py-3 rounded-xl text-white font-mono text-2xl text-center border-2 border-mc-stone/50 focus:border-mc-grass focus:outline-none transition-colors"
                        min="1024"
                        max="65535"
                        value="25565"
                    />
                    <div class="bg-mc-coal/30 px-4 py-3 rounded-lg border border-mc-stone/30">
                        <p class="text-gray-400 text-sm pixel-text-small">
                            💡 Default Minecraft port is <span class="text-mc-diamond">25565</span>
                        </p>
                    </div>
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
                <p class="text-gray-300 mb-8 text-lg pixel-text-small">Choose a game profile preset:</p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="option-card" data-value="survival-default">
                        <div class="text-4xl mb-4">⚔️</div>
                        <h4>Survival</h4>
                        <p>Default survival mode</p>
                    </div>
                    <div class="option-card" data-value="creative-flat">
                        <div class="text-4xl mb-4">🎨</div>
                        <h4>Creative</h4>
                        <p>Flat world, creative mode</p>
                    </div>
                    <div class="option-card" data-value="hardcore-minimal">
                        <div class="text-4xl mb-4">💀</div>
                        <h4>Hardcore</h4>
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
                <div class="space-y-6">
                    <div class="bg-mc-coal/30 p-6 rounded-xl border-2 border-mc-stone/30 hover:border-mc-grass/50 transition-colors">
                        <label class="flex items-center gap-4 cursor-pointer group">
                            <input type="checkbox" id="upnp-checkbox" checked class="transform scale-150">
                            <div>
                                <div class="text-mc-grass font-bold pixel-text-small text-lg group-hover:text-mc-emerald transition-colors">
                                    Enable UPnP
                                </div>
                                <div class="text-gray-400 text-sm pixel-text-small mt-1">
                                    Automatic port forwarding (recommended)
                                </div>
                            </div>
                        </label>
                    </div>
                    <div class="bg-mc-coal/30 p-6 rounded-xl border-2 border-mc-stone/30 hover:border-mc-diamond/50 transition-colors">
                        <label class="flex items-center gap-4 cursor-pointer group">
                            <input type="checkbox" id="backup-checkbox" checked class="transform scale-150">
                            <div>
                                <div class="text-mc-diamond font-bold pixel-text-small text-lg group-hover:text-mc-grass transition-colors">
                                    Backup on Exit
                                </div>
                                <div class="text-gray-400 text-sm pixel-text-small mt-1">
                                    Automatically backup world when stopping server
                                </div>
                            </div>
                        </label>
                    </div>
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
            title: 'Ready to Launch!',
            render: () => {
                return `
                    <div class="space-y-6">
                        <div class="bg-gradient-to-br from-mc-grass/20 to-mc-emerald/20 p-6 rounded-2xl border-2 border-mc-grass/50">
                            <h3 class="text-xl font-bold text-mc-gold mb-4 pixel-text">📋 Configuration Summary</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-mc-coal/50 p-4 rounded-lg">
                                    <div class="text-gray-400 text-xs pixel-text-small mb-1">Server Type</div>
                                    <div class="text-mc-grass font-bold text-lg pixel-text-small">${Wizard.answers.serverType || 'N/A'}</div>
                                </div>
                                <div class="bg-mc-coal/50 p-4 rounded-lg">
                                    <div class="text-gray-400 text-xs pixel-text-small mb-1">Version</div>
                                    <div class="text-mc-diamond font-bold text-lg pixel-text-small">${Wizard.answers.minecraftVersion || 'N/A'}</div>
                                </div>
                                <div class="bg-mc-coal/50 p-4 rounded-lg">
                                    <div class="text-gray-400 text-xs pixel-text-small mb-1">World</div>
                                    <div class="text-mc-grass font-bold text-lg pixel-text-small">${Wizard.answers.worldChoice === 'new' ? 'New World' : 'Existing'}</div>
                                </div>
                                <div class="bg-mc-coal/50 p-4 rounded-lg">
                                    <div class="text-gray-400 text-xs pixel-text-small mb-1">RAM</div>
                                    <div class="text-mc-diamond font-bold text-lg pixel-text-small">${Wizard.answers.ramGB || 'N/A'}GB</div>
                                </div>
                                <div class="bg-mc-coal/50 p-4 rounded-lg">
                                    <div class="text-gray-400 text-xs pixel-text-small mb-1">Port</div>
                                    <div class="text-mc-grass font-bold text-lg pixel-text-small">${Wizard.answers.port || 'N/A'}</div>
                                </div>
                                <div class="bg-mc-coal/50 p-4 rounded-lg">
                                    <div class="text-gray-400 text-xs pixel-text-small mb-1">Profile</div>
                                    <div class="text-mc-diamond font-bold text-lg pixel-text-small">${Wizard.answers.profile || 'N/A'}</div>
                                </div>
                            </div>
                            <div class="flex gap-4 mt-4">
                                <div class="flex-1 bg-mc-coal/50 p-3 rounded-lg text-center">
                                    <div class="text-sm pixel-text-small ${Wizard.answers.upnpEnabled ? 'text-mc-emerald' : 'text-gray-500'}">
                                        ${Wizard.answers.upnpEnabled ? '✓' : '✗'} UPnP
                                    </div>
                                </div>
                                <div class="flex-1 bg-mc-coal/50 p-3 rounded-lg text-center">
                                    <div class="text-sm pixel-text-small ${Wizard.answers.backupOnExit ? 'text-mc-emerald' : 'text-gray-500'}">
                                        ${Wizard.answers.backupOnExit ? '✓' : '✗'} Auto Backup
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="text-center">
                            <p class="text-2xl text-mc-gold pixel-text animate-pulse">
                                🚀 Ready to launch your server!
                            </p>
                        </div>
                    </div>
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

        // Update title
        title.textContent = step.title;

        // Render content with fade animation
        content.style.opacity = '0';
        setTimeout(() => {
            content.innerHTML = step.render();
            content.style.transition = 'opacity 0.3s ease';
            content.style.opacity = '1';
            this.attachStepListeners();
        }, 150);

        // Update buttons
        if (this.currentStep > 0) {
            backBtn.classList.remove('hidden');
        } else {
            backBtn.classList.add('hidden');
        }

        if (this.currentStep === this.steps.length - 1) {
            nextBtn.innerHTML = 'Launch Server! 🚀';
            nextBtn.classList.add('animate-pulse');
        } else {
            nextBtn.innerHTML = 'Next →';
            nextBtn.classList.remove('animate-pulse');
        }

        // Update progress bar
        const progressPercent = ((this.currentStep + 1) / this.steps.length) * 100;
        progress.style.width = `${progressPercent}%`;
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
