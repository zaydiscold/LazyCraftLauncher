/**
 * Action Buttons Component
 */

import React from 'react';
import { Box, Text } from 'ink';

interface ActionButtonsProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ selectedIndex, onSelect }) => {
  const buttons = [
    { label: 'Restart', color: 'yellow' },
    { label: 'Backup', color: 'cyan' },
    { label: 'Stop', color: 'red' }
  ];

  return (
    <Box gap={2}>
      {buttons.map((button, index) => (
        <Box
          key={button.label}
          borderStyle="single"
          borderColor={selectedIndex === index ? 'green' : 'gray'}
          paddingX={1}
        >
          <Text color={selectedIndex === index ? button.color : 'gray'} bold={selectedIndex === index}>
            {button.label}
          </Text>
        </Box>
      ))}
    </Box>
  );
};