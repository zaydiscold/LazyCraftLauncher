/**
 * Interactive Setup Wizard Component (Refactored)
 *
 * This is a cleaner, more maintainable version of the setup wizard that uses:
 * - Custom hooks for state management
 * - Separate step components for each wizard step
 * - Clear separation of concerns
 *
 * **Architecture:**
 * - `useWizard` hook manages all state and navigation logic
 * - Step components handle UI rendering for each step
 * - This component orchestrates the flow between steps
 *
 * @module ui/Wizard
 */

import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { Banner } from './components/Banner.js';
import { ModeStep } from './steps/ModeStep.js';
import { ServerTypeStep } from './steps/ServerTypeStep.js';
import { ConfirmStep } from './steps/ConfirmStep.js';
import { useWizard } from './hooks/useWizard.js';
import type { LazyConfig, SystemInfo, WizardAnswers } from '../types/index.js';

/**
 * Props for the Wizard component
 */
interface WizardProps {
  /** Previously saved configuration (null if first run) */
  savedConfig: LazyConfig | null;
  /** Detected system information */
  systemInfo: SystemInfo;
  /** Callback when wizard is completed */
  onComplete: (answers: WizardAnswers) => void;
}

/**
 * Main Wizard Component
 *
 * Guides users through server configuration with a step-by-step interface.
 * Handles both quick launch (using saved config) and advanced setup (full wizard).
 *
 * @param props - Component props
 * @returns React component
 */
export const Wizard: React.FC<WizardProps> = ({
  savedConfig,
  systemInfo,
  onComplete,
}) => {
  // Use custom hook for state management
  const wizard = useWizard(savedConfig, systemInfo);

  /**
   * Handle mode selection (Quick Launch vs Advanced Setup)
   */
  const handleModeSelect = (mode: 'quick' | 'advanced') => {
    wizard.updateAnswer('mode', mode);

    if (mode === 'quick' && savedConfig) {
      // Quick launch: use saved configuration
      onComplete({
        mode: 'quick',
        serverType: savedConfig.serverType,
        minecraftVersion: savedConfig.minecraftVersion,
        worldPath: savedConfig.worldPath,
        worldChoice: savedConfig.isNewWorld ? 'new' : 'existing',
        ramGB: savedConfig.ramGB,
        port: savedConfig.port,
        profile: savedConfig.profile,
        upnp: savedConfig.upnpEnabled,
        backup: savedConfig.backupOnExit,
      });
    } else {
      // Advanced setup: go to next step
      wizard.goToStep('serverType');
    }
  };

  /**
   * Handle server type selection
   */
  const handleServerTypeSelect = (serverType: LazyConfig['serverType']) => {
    wizard.updateAnswer('serverType', serverType);
    wizard.goNext();
  };

  /**
   * Handle version input submission
   */
  const handleVersionSubmit = () => {
    const version = wizard.inputValue || 'latest';
    wizard.updateAnswer('minecraftVersion', version);
    wizard.setInputValue('');
    wizard.goNext();
  };

  /**
   * Handle world choice selection
   */
  const handleWorldSelect = (item: { value: string }) => {
    wizard.updateAnswer('worldChoice', item.value as 'new' | 'existing');
    wizard.goNext(); // Hook will handle conditional navigation
  };

  /**
   * Handle world path submission
   */
  const handleWorldPathSubmit = async () => {
    const path = wizard.inputValue || './world';
    const isValid = await wizard.validateWorldPath(
      path,
      wizard.answers.worldChoice === 'existing'
    );

    if (isValid) {
      wizard.updateAnswer('worldPath', path);
      wizard.setInputValue('');
      wizard.goNext();
    }
  };

  /**
   * Handle RAM input submission
   */
  const handleRamSubmit = () => {
    const ramGB = parseInt(wizard.inputValue) || 2;
    const maxRam = Math.floor(systemInfo.totalRAMGB * 0.8);

    if (wizard.validateRam(ramGB, maxRam)) {
      wizard.updateAnswer('ramGB', ramGB);
      wizard.setInputValue('');
      wizard.goNext();
    }
  };

  /**
   * Handle port input submission
   */
  const handlePortSubmit = () => {
    const port = parseInt(wizard.inputValue) || 25565;

    if (wizard.validatePort(port)) {
      wizard.updateAnswer('port', port);
      wizard.setInputValue('');
      wizard.goNext();
    }
  };

  /**
   * Handle profile selection
   */
  const handleProfileSelect = (item: { value: string }) => {
    wizard.updateAnswer('profile', item.value);
    wizard.goNext();
  };

  /**
   * Handle advanced options toggle
   */
  const handleAdvancedSelect = (item: { value: string }) => {
    const [key, value] = item.value.split(':');
    wizard.updateAnswer(key as any, value === 'true');

    if (key === 'backup') {
      wizard.goNext(); // After backup setting, go to confirm
    }
  };

  /**
   * Handle final confirmation
   */
  const handleConfirm = (confirmed: boolean) => {
    if (confirmed) {
      onComplete(wizard.answers);
    } else {
      wizard.goToStep('mode'); // Start over
    }
  };

  // Render the wizard
  return (
    <Box flexDirection="column" padding={1}>
      <Banner />

      {/* Error display */}
      {wizard.error && (
        <Box marginTop={1}>
          <Text color="red">❌ Error: {wizard.error}</Text>
        </Box>
      )}

      {/* Step rendering */}
      <Box marginTop={1}>
        {wizard.step === 'mode' && (
          <ModeStep savedConfig={savedConfig} onSelect={handleModeSelect} />
        )}

        {wizard.step === 'serverType' && (
          <ServerTypeStep onSelect={handleServerTypeSelect} />
        )}

        {wizard.step === 'version' && (
          <Box flexDirection="column">
            <Text color="cyan" bold>
              Minecraft Version:
            </Text>
            <Text color="gray" dimColor>
              Press Enter for latest, or type a specific version (e.g., 1.21.3)
            </Text>
            <Box marginTop={1}>
              <TextInput
                value={wizard.inputValue}
                onChange={wizard.setInputValue}
                onSubmit={handleVersionSubmit}
                placeholder="latest"
              />
            </Box>
          </Box>
        )}

        {wizard.step === 'world' && (
          <Box flexDirection="column">
            <Text color="cyan" bold>
              World Setup:
            </Text>
            <Box marginTop={1}>
              <SelectInput
                items={[
                  { label: '🌍 Create new world', value: 'new' },
                  { label: '📂 Use existing world folder', value: 'existing' },
                ]}
                onSelect={handleWorldSelect}
              />
            </Box>
          </Box>
        )}

        {wizard.step === 'worldPath' && (
          <Box flexDirection="column">
            <Text color="cyan" bold>
              Path to existing world folder:
            </Text>
            <Box marginTop={1}>
              <TextInput
                value={wizard.inputValue}
                onChange={wizard.setInputValue}
                onSubmit={handleWorldPathSubmit}
                placeholder="./world"
              />
            </Box>
          </Box>
        )}

        {wizard.step === 'ram' && (
          <Box flexDirection="column">
            <Text color="cyan" bold>
              RAM allocation in GB:
            </Text>
            <Text color="gray" dimColor>
              System: {systemInfo.totalRAMGB}GB total, recommended max:{' '}
              {Math.floor(systemInfo.totalRAMGB * 0.8)}GB
            </Text>
            <Box marginTop={1}>
              <TextInput
                value={wizard.inputValue}
                onChange={wizard.setInputValue}
                onSubmit={handleRamSubmit}
                placeholder="2"
              />
            </Box>
          </Box>
        )}

        {wizard.step === 'port' && (
          <Box flexDirection="column">
            <Text color="cyan" bold>
              Server port:
            </Text>
            <Text color="gray" dimColor>
              Default: 25565 (Minecraft standard port)
            </Text>
            <Box marginTop={1}>
              <TextInput
                value={wizard.inputValue}
                onChange={wizard.setInputValue}
                onSubmit={handlePortSubmit}
                placeholder="25565"
              />
            </Box>
          </Box>
        )}

        {wizard.step === 'profile' && (
          <Box flexDirection="column">
            <Text color="cyan" bold>
              Game Profile:
            </Text>
            <Box marginTop={1}>
              <SelectInput
                items={[
                  {
                    label: '⚔️  Survival Default - Normal survival gameplay',
                    value: 'survival-default',
                  },
                  {
                    label: '🎨 Creative Flat - Peaceful creative mode',
                    value: 'creative-flat',
                  },
                  {
                    label: '💀 Hardcore Minimal - Hard difficulty, one life',
                    value: 'hardcore-minimal',
                  },
                ]}
                onSelect={handleProfileSelect}
              />
            </Box>
          </Box>
        )}

        {wizard.step === 'advanced' && (
          <Box flexDirection="column">
            <Text color="cyan" bold>
              Advanced Options:
            </Text>
            <Text color="gray" dimColor>
              Toggle each option on/off
            </Text>
            <Box marginTop={1}>
              <SelectInput
                items={[
                  {
                    label: `UPnP Port Forwarding: ${
                      wizard.answers.upnp !== false ? '✓ Enabled' : '✗ Disabled'
                    }`,
                    value: `upnp:${wizard.answers.upnp !== false}`,
                  },
                  {
                    label: `Backup on Exit: ${
                      wizard.answers.backup !== false ? '✓ Enabled' : '✗ Disabled'
                    }`,
                    value: `backup:${wizard.answers.backup !== false}`,
                  },
                ]}
                onSelect={handleAdvancedSelect}
              />
            </Box>
          </Box>
        )}

        {wizard.step === 'confirm' && (
          <ConfirmStep answers={wizard.answers} onConfirm={handleConfirm} />
        )}
      </Box>

      {/* Help text */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Use arrow keys to navigate • Enter to select • Esc to go back
        </Text>
      </Box>
    </Box>
  );
};
