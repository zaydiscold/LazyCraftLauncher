/**
 * Banner component for consistent branding
 */

import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

export const Banner: React.FC = () => (
  <Box flexDirection="column">
    <Text color={theme.primary} bold>
      LazyCraftLauncher
    </Text>
    <Text color={theme.muted}>Lazy multiplayer hosting for Minecraft</Text>
  </Box>
);
