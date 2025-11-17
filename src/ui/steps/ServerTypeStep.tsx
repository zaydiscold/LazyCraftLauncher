/**
 * Server Type Selection Step
 *
 * Allows users to choose which type of Minecraft server to run:
 * - Vanilla: Official Minecraft server
 * - Forge: Modded server (supports Forge mods)
 * - Fabric: Modded server (supports Fabric mods) - Coming soon
 * - Paper: Optimized server - Coming soon
 *
 * @module ui/steps/ServerTypeStep
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
  value: LazyConfig['serverType'];
  disabled?: boolean;
}

/**
 * Props for ServerTypeStep component
 */
interface ServerTypeStepProps {
  onSelect: (serverType: LazyConfig['serverType']) => void;
}

/**
 * Server type selection step component
 *
 * @param props - Component props
 * @returns React component
 */
export const ServerTypeStep: React.FC<ServerTypeStepProps> = ({ onSelect }) => {
  const items: SelectItem[] = [
    {
      label: '📦 Vanilla - Pure Minecraft (recommended for beginners)',
      value: 'vanilla',
    },
    {
      label: '🔨 Forge - Modded server (supports Forge mods)',
      value: 'forge',
    },
    {
      label: '🧵 Fabric - (Coming soon)',
      value: 'fabric',
      disabled: true,
    },
    {
      label: '📄 Paper - (Coming soon)',
      value: 'paper',
      disabled: true,
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
        Select Server Type:
      </Text>

      <Box marginTop={1}>
        <SelectInput items={items as any} onSelect={handleSelect} />
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text color="gray" dimColor>
          💡 Not sure? Choose Vanilla for the standard Minecraft experience.
        </Text>
        <Text color="gray" dimColor>
          Choose Forge if you want to add mods to your server.
        </Text>
      </Box>
    </Box>
  );
};
