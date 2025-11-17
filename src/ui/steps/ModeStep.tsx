/**
 * Wizard Mode Selection Step
 *
 * First step of the wizard that lets users choose between:
 * - Quick Launch: Use previously saved configuration
 * - Advanced Setup: Go through full wizard
 *
 * @module ui/steps/ModeStep
 */

import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import type { LazyConfig } from '../../types/index.js';

/**
 * Item structure for SelectInput
 */
interface SelectItem {
  label: string;
  value: 'quick' | 'advanced';
  disabled?: boolean;
}

/**
 * Props for ModeStep component
 */
interface ModeStepProps {
  savedConfig: LazyConfig | null;
  onSelect: (mode: 'quick' | 'advanced') => void;
}

/**
 * Mode selection step component
 *
 * Displays two options:
 * - Quick Launch (disabled if no saved config exists)
 * - Advanced Setup (always available)
 *
 * @param props - Component props
 * @returns React component
 */
export const ModeStep: React.FC<ModeStepProps> = ({ savedConfig, onSelect }) => {
  const items: SelectItem[] = [
    {
      label: '⚡ Quick Launch - Use saved settings',
      value: 'quick',
      disabled: !savedConfig,
    },
    {
      label: '🔧 Advanced Setup - Configure everything',
      value: 'advanced',
    },
  ];

  const handleSelect = (item: SelectItem) => {
    if (!item.disabled) {
      onSelect(item.value);
    }
  };

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        Choose Launch Mode:
      </Text>

      {!savedConfig && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            No saved configuration found. Advanced setup required.
          </Text>
        </Box>
      )}

      <Box marginTop={1}>
        <SelectInput items={items as any} onSelect={handleSelect} />
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Tip: Quick launch skips all questions and uses your last configuration.
        </Text>
      </Box>
    </Box>
  );
};
