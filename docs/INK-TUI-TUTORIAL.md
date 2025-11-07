# Building Beautiful Terminal UIs with Ink

## The Complete Guide to React-Based TUIs

This is the exact style used in LazyCraftLauncher - bordered boxes, arrow key navigation, live updates, and gorgeous layouts.

---

## 🚀 Quick Start

### Installation

```bash
npm install ink react
npm install ink-box ink-text-input ink-select-input ink-spinner
npm install chalk gradient-string
npm install --save-dev @types/react @types/node tsx
```

### Basic Setup

```json
// package.json
{
  "scripts": {
    "dev": "tsx watch src/index.tsx",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "jsx": "react",
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

---

## 📦 Core Components

### 1. Basic Layout with Boxes

```tsx
// src/components/Dashboard.tsx
import React from 'react';
import { Box, Text } from 'ink';

export const Dashboard = () => {
  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="round" borderColor="cyan" padding={1}>
        <Text bold color="cyan">My Awesome CLI Dashboard</Text>
      </Box>

      {/* Two-column layout */}
      <Box marginTop={1}>
        {/* Left column */}
        <Box
          borderStyle="round"
          borderColor="green"
          padding={1}
          marginRight={2}
          width="50%"
        >
          <Box flexDirection="column">
            <Text bold color="green">Status</Text>
            <Text dimColor>────────────</Text>
            <Text>● Running</Text>
            <Text>Uptime: 2h 15m</Text>
          </Box>
        </Box>

        {/* Right column */}
        <Box
          borderStyle="round"
          borderColor="blue"
          padding={1}
          width="50%"
        >
          <Box flexDirection="column">
            <Text bold color="blue">Info</Text>
            <Text dimColor>────────────</Text>
            <Text>Version: 1.0.0</Text>
            <Text>Port: 8080</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
```

### 2. Interactive Buttons with Arrow Keys

```tsx
// src/components/ActionButtons.tsx
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface ActionButtonsProps {
  onRestart: () => void;
  onBackup: () => void;
  onStop: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onRestart,
  onBackup,
  onStop,
}) => {
  const [selected, setSelected] = useState(0);

  useInput((input, key) => {
    if (key.leftArrow) {
      setSelected((prev) => (prev === 0 ? 2 : prev - 1));
    }
    if (key.rightArrow) {
      setSelected((prev) => (prev === 2 ? 0 : prev + 1));
    }
    if (key.return) {
      if (selected === 0) onRestart();
      if (selected === 1) onBackup();
      if (selected === 2) onStop();
    }
  });

  const buttons = [
    { label: 'Restart', color: 'yellow' },
    { label: 'Backup', color: 'blue' },
    { label: 'Stop', color: 'red' },
  ];

  return (
    <Box marginTop={1}>
      {buttons.map((btn, idx) => (
        <Box
          key={idx}
          borderStyle={selected === idx ? 'bold' : 'round'}
          borderColor={selected === idx ? btn.color : 'gray'}
          paddingX={2}
          marginX={1}
        >
          <Text
            bold={selected === idx}
            color={selected === idx ? btn.color : 'white'}
          >
            {btn.label}
          </Text>
        </Box>
      ))}
    </Box>
  );
};
```

### 3. Live Status Updates

```tsx
// src/components/LiveStatus.tsx
import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface StatusData {
  status: 'running' | 'stopped' | 'starting';
  uptime: number;
  players: number;
}

export const LiveStatus: React.FC = () => {
  const [status, setStatus] = useState<StatusData>({
    status: 'starting',
    uptime: 0,
    players: 0,
  });

  // Simulate live updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      // Replace with your actual status fetching logic
      const newStatus = await fetchStatus();
      setStatus(newStatus);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status.status) {
      case 'running': return 'green';
      case 'stopped': return 'red';
      case 'starting': return 'yellow';
    }
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <Box borderStyle="round" borderColor={getStatusColor()} padding={1}>
      <Box flexDirection="column">
        <Text bold color={getStatusColor()}>
          Status
        </Text>
        <Text dimColor>────────────</Text>

        <Box>
          <Text>Status: </Text>
          {status.status === 'starting' && (
            <Text color="yellow">
              <Spinner type="dots" /> Starting...
            </Text>
          )}
          {status.status === 'running' && (
            <Text color="green">● Running</Text>
          )}
          {status.status === 'stopped' && (
            <Text color="red">○ Stopped</Text>
          )}
        </Box>

        <Text>Uptime: {formatUptime(status.uptime)}</Text>
        <Text>Players: {status.players}/20</Text>
      </Box>
    </Box>
  );
};

// Mock fetch function - replace with your actual API
async function fetchStatus(): Promise<StatusData> {
  return {
    status: 'running',
    uptime: Math.floor(Date.now() / 1000),
    players: Math.floor(Math.random() * 10),
  };
}
```

### 4. Multi-Step Wizard

```tsx
// src/components/Wizard.tsx
import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';

interface WizardProps {
  onComplete: (answers: WizardAnswers) => void;
}

interface WizardAnswers {
  name: string;
  port: number;
  mode: string;
}

export const Wizard: React.FC<WizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<WizardAnswers>>({});

  const steps = [
    {
      title: 'What is your project name?',
      type: 'text',
      key: 'name',
    },
    {
      title: 'What port should we use?',
      type: 'text',
      key: 'port',
    },
    {
      title: 'Select a mode:',
      type: 'select',
      key: 'mode',
      options: [
        { label: 'Development', value: 'dev' },
        { label: 'Production', value: 'prod' },
        { label: 'Testing', value: 'test' },
      ],
    },
  ];

  const currentStep = steps[step];

  const handleSubmit = (value: string) => {
    const newAnswers = { ...answers, [currentStep.key]: value };
    setAnswers(newAnswers);

    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(newAnswers as WizardAnswers);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Progress indicator */}
      <Box marginBottom={1}>
        <Text dimColor>
          Step {step + 1} of {steps.length}
        </Text>
      </Box>

      {/* Question */}
      <Box borderStyle="round" borderColor="cyan" padding={1}>
        <Text bold color="cyan">{currentStep.title}</Text>
      </Box>

      {/* Input area */}
      <Box marginTop={1} marginLeft={2}>
        {currentStep.type === 'text' && (
          <TextInput
            placeholder="Type your answer..."
            onSubmit={handleSubmit}
          />
        )}

        {currentStep.type === 'select' && currentStep.options && (
          <SelectInput
            items={currentStep.options}
            onSelect={(item) => handleSubmit(item.value)}
          />
        )}
      </Box>

      {/* Help text */}
      <Box marginTop={1}>
        <Text dimColor>
          {currentStep.type === 'text' && '↵ Press Enter to continue'}
          {currentStep.type === 'select' && '↑↓ Navigate, ↵ Select'}
        </Text>
      </Box>
    </Box>
  );
};
```

### 5. Gradient Header Banner

```tsx
// src/components/Banner.tsx
import React from 'react';
import { Box, Text } from 'ink';
import gradient from 'gradient-string';

export const Banner: React.FC = () => {
  const banner = `
╔═══════════════════════════════════╗
║   MY AWESOME CLI APPLICATION      ║
║   "Making terminals beautiful"    ║
╔═══════════════════════════════════╗
  `.trim();

  const gradientBanner = gradient.rainbow(banner);

  return (
    <Box justifyContent="center" marginBottom={1}>
      <Text>{gradientBanner}</Text>
    </Box>
  );
};
```

---

## 🎯 Complete Example App

```tsx
// src/index.tsx
import React, { useState } from 'react';
import { render, Box } from 'ink';
import { Banner } from './components/Banner.js';
import { Wizard } from './components/Wizard.js';
import { Dashboard } from './components/Dashboard.js';
import { ActionButtons } from './components/ActionButtons.js';
import { LiveStatus } from './components/LiveStatus.js';

type AppState = 'wizard' | 'dashboard';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('wizard');
  const [config, setConfig] = useState<any>(null);

  const handleWizardComplete = (answers: any) => {
    setConfig(answers);
    setState('dashboard');
  };

  const handleRestart = () => {
    console.log('Restarting...');
  };

  const handleBackup = () => {
    console.log('Creating backup...');
  };

  const handleStop = () => {
    process.exit(0);
  };

  return (
    <Box flexDirection="column">
      <Banner />

      {state === 'wizard' && (
        <Wizard onComplete={handleWizardComplete} />
      )}

      {state === 'dashboard' && (
        <>
          <Dashboard />
          <LiveStatus />
          <ActionButtons
            onRestart={handleRestart}
            onBackup={handleBackup}
            onStop={handleStop}
          />
        </>
      )}
    </Box>
  );
};

render(<App />);
```

---

## 🎨 Styling Tips

### Colors
```tsx
<Text color="green">Success</Text>
<Text color="red">Error</Text>
<Text color="yellow">Warning</Text>
<Text color="blue">Info</Text>
<Text color="cyan">Highlight</Text>
<Text dimColor>Subtle text</Text>
```

### Box Styling
```tsx
<Box
  borderStyle="round"      // round, single, double, bold
  borderColor="cyan"       // any color
  padding={1}              // inner spacing
  margin={1}               // outer spacing
  paddingX={2}             // horizontal padding
  marginTop={1}            // specific margin
  width="50%"              // or number
  height={10}              // fixed height
/>
```

### Layout
```tsx
{/* Horizontal layout */}
<Box flexDirection="row">
  <Box>Left</Box>
  <Box>Right</Box>
</Box>

{/* Vertical layout (default) */}
<Box flexDirection="column">
  <Box>Top</Box>
  <Box>Bottom</Box>
</Box>

{/* Centered */}
<Box justifyContent="center" alignItems="center">
  <Text>Centered!</Text>
</Box>

{/* Space between */}
<Box justifyContent="space-between">
  <Text>Left</Text>
  <Text>Right</Text>
</Box>
```

---

## 🔑 Keyboard Input Handling

```tsx
import { useInput } from 'ink';

const MyComponent = () => {
  useInput((input, key) => {
    // Arrow keys
    if (key.leftArrow) console.log('←');
    if (key.rightArrow) console.log('→');
    if (key.upArrow) console.log('↑');
    if (key.downArrow) console.log('↓');

    // Special keys
    if (key.return) console.log('Enter');
    if (key.escape) console.log('Esc');
    if (key.tab) console.log('Tab');
    if (key.backspace) console.log('Backspace');

    // Ctrl combinations
    if (input === 'q') process.exit(0);
    if (key.ctrl && input === 'c') process.exit(0);

    // Regular characters
    console.log(`Pressed: ${input}`);
  });

  return <Text>Press any key...</Text>;
};
```

---

## 📊 Advanced Patterns

### Progress Bar
```tsx
import React from 'react';
import { Box, Text } from 'ink';

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  const barLength = 30;
  const filled = Math.round((progress / 100) * barLength);
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

  return (
    <Box>
      <Text color="cyan">[{bar}]</Text>
      <Text> {progress}%</Text>
    </Box>
  );
};
```

### Table Display
```tsx
import React from 'react';
import { Box, Text } from 'ink';

const Table: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box>
        <Text bold color="cyan">Name</Text>
        <Text bold color="cyan" marginLeft={2}>Status</Text>
        <Text bold color="cyan" marginLeft={2}>Value</Text>
      </Box>

      {/* Rows */}
      {data.map((row, idx) => (
        <Box key={idx}>
          <Text>{row.name}</Text>
          <Text marginLeft={2}>{row.status}</Text>
          <Text marginLeft={2}>{row.value}</Text>
        </Box>
      ))}
    </Box>
  );
};
```

### Tabs
```tsx
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

const Tabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Status', 'Logs', 'Config'];

  useInput((input, key) => {
    if (key.leftArrow) {
      setActiveTab((prev) => (prev === 0 ? tabs.length - 1 : prev - 1));
    }
    if (key.rightArrow) {
      setActiveTab((prev) => (prev === tabs.length - 1 ? 0 : prev + 1));
    }
  });

  return (
    <Box flexDirection="column">
      {/* Tab headers */}
      <Box>
        {tabs.map((tab, idx) => (
          <Box
            key={idx}
            borderStyle={activeTab === idx ? 'bold' : 'round'}
            borderColor={activeTab === idx ? 'cyan' : 'gray'}
            paddingX={2}
            marginX={1}
          >
            <Text bold={activeTab === idx}>{tab}</Text>
          </Box>
        ))}
      </Box>

      {/* Tab content */}
      <Box marginTop={1} borderStyle="round" padding={1}>
        {activeTab === 0 && <Text>Status content here</Text>}
        {activeTab === 1 && <Text>Logs content here</Text>}
        {activeTab === 2 && <Text>Config content here</Text>}
      </Box>
    </Box>
  );
};
```

---

## 🚀 Real-World Examples from LazyCraftLauncher

Check these files for production-ready examples:
- `src/ui/Dashboard.tsx` - Full dashboard layout
- `src/ui/Wizard.tsx` - Multi-step wizard
- `src/ui/components/StatusPanel.tsx` - Live status display
- `src/ui/components/ActionButtons.tsx` - Interactive buttons
- `src/ui/components/AddressPanel.tsx` - Info display

---

## 💡 Pro Tips

1. **Use `useApp()` to exit gracefully:**
   ```tsx
   import { useApp } from 'ink';
   const { exit } = useApp();
   exit();
   ```

2. **Clear screen on start:**
   ```tsx
   import { render } from 'ink';
   console.clear();
   render(<App />);
   ```

3. **Handle errors:**
   ```tsx
   try {
     render(<App />);
   } catch (error) {
     console.error('Fatal error:', error);
     process.exit(1);
   }
   ```

4. **Use `useFocus()` for complex navigation:**
   ```tsx
   import { useFocus } from 'ink';
   const { isFocused } = useFocus({ autoFocus: true });
   ```

---

## 📚 Resources

- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [Ink Examples](https://github.com/vadimdemedes/ink/tree/master/examples)
- [LazyCraftLauncher Source](https://github.com/zaydiscold/LazyCraftLauncher)

---

**Happy TUI building! 🎨**
