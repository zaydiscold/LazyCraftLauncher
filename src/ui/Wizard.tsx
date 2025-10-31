/**
 * Interactive Setup Wizard Component
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { Banner } from './components/Banner.js';
import { validateWorld } from '../core/world.js';
import type { LazyConfig, SystemInfo, WizardAnswers } from '../types/index.js';

interface WizardProps {
  savedConfig: LazyConfig | null;
  systemInfo: SystemInfo;
  onComplete: (answers: WizardAnswers) => void;
}

type WizardStep = 
  | 'mode'
  | 'serverType'
  | 'version'
  | 'world'
  | 'worldPath'
  | 'ram'
  | 'port'
  | 'profile'
  | 'advanced'
  | 'confirm';

export const Wizard: React.FC<WizardProps> = ({ savedConfig, systemInfo, onComplete }) => {
  const [step, setStep] = useState<WizardStep>('mode');
  const [answers, setAnswers] = useState<WizardAnswers>({
    mode: savedConfig ? 'quick' : 'advanced',
  });
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleModeSelect = (item: any) => {
    const newAnswers = { ...answers, mode: item.value };
    setAnswers(newAnswers);
    
    if (item.value === 'quick' && savedConfig) {
      // Use saved config for quick mode
      onComplete({
        ...newAnswers,
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
      setStep('serverType');
    }
  };

  const handleServerTypeSelect = (item: any) => {
    setAnswers({ ...answers, serverType: item.value });
    setStep('version');
  };

  const handleVersionSubmit = () => {
    setAnswers({ ...answers, minecraftVersion: inputValue || 'latest' });
    setInputValue('');
    setStep('world');
  };

  const handleWorldSelect = (item: any) => {
    setAnswers({ ...answers, worldChoice: item.value });
    if (item.value === 'existing') {
      setStep('worldPath');
    } else {
      setAnswers({ ...answers, worldPath: './world' });
      setStep('ram');
    }
  };

  const handleWorldPathSubmit = async () => {
    const worldPath = inputValue || './world';
    
    if (answers.worldChoice === 'existing') {
      const isValid = await validateWorld(worldPath);
      if (!isValid) {
        setError('Invalid world folder. Missing level.dat or region/ directory.');
        return;
      }
    }
    
    setAnswers({ ...answers, worldPath });
    setInputValue('');
    setError(null);
    setStep('ram');
  };

  const handleRamSubmit = () => {
    const ramGB = parseInt(inputValue) || 2;
    const maxRam = Math.floor(systemInfo.totalRAMGB * 0.8); // Leave 20% for system
    
    if (ramGB > maxRam) {
      setError(`Too much RAM! You have ${systemInfo.totalRAMGB}GB total. Max recommended: ${maxRam}GB`);
      return;
    }
    
    setAnswers({ ...answers, ramGB });
    setInputValue('');
    setError(null);
    setStep('port');
  };

  const handlePortSubmit = () => {
    const port = parseInt(inputValue) || 25565;
    
    if (port < 1024 || port > 65535) {
      setError('Port must be between 1024 and 65535');
      return;
    }
    
    setAnswers({ ...answers, port });
    setInputValue('');
    setError(null);
    setStep('profile');
  };

  const handleProfileSelect = (item: any) => {
    setAnswers({ ...answers, profile: item.value });
    setStep('advanced');
  };

  const handleAdvancedSelect = (item: any) => {
    const [key, value] = item.value.split(':');
    setAnswers({ ...answers, [key]: value === 'true' });
    
    if (key === 'backup') {
      setStep('confirm');
    }
  };

  const handleConfirm = (item: any) => {
    if (item.value === 'yes') {
      onComplete(answers);
    } else {
      setStep('mode');
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Banner />
      
      {error && (
        <Box marginTop={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        {step === 'mode' && (
          <Box flexDirection="column">
            <Text color="cyan" bold>Choose Launch Mode:</Text>
            <Box marginTop={1}>
              <SelectInput
                items={[
                  { label: 'Quick Launch - Use saved settings', value: 'quick', disabled: !savedConfig },
                  { label: 'Advanced Setup - Configure everything', value: 'advanced' }
                ]}
                onSelect={handleModeSelect}
              />
            </Box>
          </Box>
        )}

        {step === 'serverType' && (
          <Box flexDirection="column">
            <Text color="cyan" bold>Select Server Type:</Text>
            <Box marginTop={1}>
              <SelectInput
                items={[
                  { label: 'Vanilla - Pure Minecraft', value: 'vanilla' },
                  { label: 'Forge - Modded server', value: 'forge' },
                  { label: 'Fabric - (Coming soon)', value: 'fabric', disabled: true },
                  { label: 'Paper - (Coming soon)', value: 'paper', disabled: true }
                ]}
                onSelect={handleServerTypeSelect}
              />
            </Box>
          </Box>
        )}

        {step === 'version' && (
          <Box flexDirection="column">
            <Text color="cyan" bold>Minecraft Version (or press Enter for latest):</Text>
            <Box marginTop={1}>
              <TextInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleVersionSubmit}
                placeholder="e.g., 1.21.3 or latest"
              />
            </Box>
          </Box>
        )}

        {step === 'world' && (
          <Box flexDirection="column">
            <Text color="cyan" bold>World Setup:</Text>
            <Box marginTop={1}>
              <SelectInput
                items={[
                  { label: 'Create new world', value: 'new' },
                  { label: 'Use existing world folder', value: 'existing' }
                ]}
                onSelect={handleWorldSelect}
              />
            </Box>
          </Box>
        )}

        {step === 'worldPath' && (
          <Box flexDirection="column">
            <Text color="cyan" bold>Path to existing world folder:</Text>
            <Box marginTop={1}>
              <TextInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleWorldPathSubmit}
                placeholder="./world"
              />
            </Box>
          </Box>
        )}

        {step === 'ram' && (
          <Box flexDirection="column">
            <Text color="cyan" bold>RAM allocation in GB (System: {systemInfo.totalRAMGB}GB):</Text>
            <Box marginTop={1}>
              <TextInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleRamSubmit}
                placeholder="2"
              />
            </Box>
          </Box>
        )}

        {step === 'port' && (
          <Box flexDirection="column">
            <Text color="cyan" bold>Server port (default: 25565):</Text>
            <Box marginTop={1}>
              <TextInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handlePortSubmit}
                placeholder="25565"
              />
            </Box>
          </Box>
        )}

        {step === 'profile' && (
          <Box flexDirection="column">
            <Text color="cyan" bold>Game Profile:</Text>
            <Box marginTop={1}>
              <SelectInput
                items={[
                  { label: 'Survival Default - Normal survival gameplay', value: 'survival-default' },
                  { label: 'Creative Flat - Peaceful creative mode', value: 'creative-flat' },
                  { label: 'Hardcore Minimal - Hard difficulty, one life', value: 'hardcore-minimal' }
                ]}
                onSelect={handleProfileSelect}
              />
            </Box>
          </Box>
        )}

        {step === 'advanced' && (
          <Box flexDirection="column">
            <Text color="cyan" bold>Advanced Options:</Text>
            <Box marginTop={1}>
              <SelectInput
                items={[
                  { label: `UPnP Port Forwarding: ${answers.upnp !== false ? 'Enabled' : 'Disabled'}`, value: `upnp:${answers.upnp !== false}` },
                  { label: `Backup on Exit: ${answers.backup !== false ? 'Enabled' : 'Disabled'}`, value: `backup:${answers.backup !== false}` }
                ]}
                onSelect={handleAdvancedSelect}
              />
            </Box>
          </Box>
        )}

        {step === 'confirm' && (
          <Box flexDirection="column">
            <Text color="green" bold>Ready to launch server!</Text>
            <Box marginTop={1} flexDirection="column">
              <Text>Server Type: {answers.serverType}</Text>
              <Text>Version: {answers.minecraftVersion}</Text>
              <Text>World: {answers.worldChoice === 'new' ? 'New world' : answers.worldPath}</Text>
              <Text>RAM: {answers.ramGB}GB</Text>
              <Text>Port: {answers.port}</Text>
              <Text>Profile: {answers.profile}</Text>
            </Box>
            <Box marginTop={1}>
              <SelectInput
                items={[
                  { label: 'Yes, launch server!', value: 'yes' },
                  { label: 'No, start over', value: 'no' }
                ]}
                onSelect={handleConfirm}
              />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};