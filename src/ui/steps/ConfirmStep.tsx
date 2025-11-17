/**
 * Configuration Confirmation Step
 *
 * Final step of the wizard that shows a summary of all selections
 * and asks for confirmation before proceeding with server setup.
 *
 * @module ui/steps/ConfirmStep
 */

import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import type { WizardAnswers } from '../../types/index.js';

/**
 * Item structure for SelectInput
 */
interface SelectItem {
  label: string;
  value: 'yes' | 'no';
}

/**
 * Props for ConfirmStep component
 */
interface ConfirmStepProps {
  answers: WizardAnswers;
  onConfirm: (confirmed: boolean) => void;
}

/**
 * Confirmation step component
 *
 * Displays a summary of all user selections and asks for final confirmation.
 *
 * @param props - Component props
 * @returns React component
 */
export const ConfirmStep: React.FC<ConfirmStepProps> = ({ answers, onConfirm }) => {
  const items: SelectItem[] = [
    {
      label: '✓ Yes, launch server!',
      value: 'yes',
    },
    {
      label: '✗ No, start over',
      value: 'no',
    },
  ];

  const handleSelect = (item: SelectItem) => {
    onConfirm(item.value === 'yes');
  };

  return (
    <Box flexDirection="column">
      <Text color="green" bold>
        🚀 Ready to launch server!
      </Text>

      <Box marginTop={1} flexDirection="column" borderStyle="round" borderColor="cyan" padding={1}>
        <Text bold underline>
          Configuration Summary:
        </Text>

        <Box marginTop={1} flexDirection="column">
          <Text>
            <Text color="cyan">Server Type:</Text> {answers.serverType || 'vanilla'}
          </Text>
          <Text>
            <Text color="cyan">Version:</Text> {answers.minecraftVersion || 'latest'}
          </Text>
          <Text>
            <Text color="cyan">World:</Text>{' '}
            {answers.worldChoice === 'new' ? 'New world' : answers.worldPath}
          </Text>
          <Text>
            <Text color="cyan">RAM:</Text> {answers.ramGB || 2}GB
          </Text>
          <Text>
            <Text color="cyan">Port:</Text> {answers.port || 25565}
          </Text>
          <Text>
            <Text color="cyan">Profile:</Text> {answers.profile || 'survival-default'}
          </Text>
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text>
            <Text color="cyan">UPnP Port Forwarding:</Text>{' '}
            {answers.upnp !== false ? '✓ Enabled' : '✗ Disabled'}
          </Text>
          <Text>
            <Text color="cyan">Backup on Exit:</Text>{' '}
            {answers.backup !== false ? '✓ Enabled' : '✗ Disabled'}
          </Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <SelectInput items={items as any} onSelect={handleSelect} />
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          This configuration will be saved for quick launch next time.
        </Text>
      </Box>
    </Box>
  );
};
