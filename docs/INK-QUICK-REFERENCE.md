# Ink TUI Quick Reference Card

## 🎯 Copy-Paste Snippets

### Basic Layout Template
```tsx
import React from 'react';
import { Box, Text, useInput } from 'ink';

const App = () => {
  useInput((input, key) => {
    if (input === 'q') process.exit(0);
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="round" borderColor="cyan" padding={1}>
        <Text bold color="cyan">Title</Text>
      </Box>

      {/* Two columns */}
      <Box marginTop={1}>
        <Box borderStyle="round" padding={1} marginRight={1} width="50%">
          <Text>Left Panel</Text>
        </Box>
        <Box borderStyle="round" padding={1} width="50%">
          <Text>Right Panel</Text>
        </Box>
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>Q to quit</Text>
      </Box>
    </Box>
  );
};
```

### Status Indicator
```tsx
const StatusIndicator = ({ running }: { running: boolean }) => (
  <Text color={running ? 'green' : 'red'}>
    {running ? '●' : '○'} {running ? 'Running' : 'Stopped'}
  </Text>
);
```

### Button Row
```tsx
const [selected, setSelected] = useState(0);

useInput((input, key) => {
  if (key.leftArrow) setSelected(prev => Math.max(0, prev - 1));
  if (key.rightArrow) setSelected(prev => Math.min(2, prev + 1));
  if (key.return) handleAction(selected);
});

return (
  <Box>
    {['Action 1', 'Action 2', 'Action 3'].map((label, idx) => (
      <Box
        key={idx}
        borderStyle={selected === idx ? 'bold' : 'round'}
        borderColor={selected === idx ? 'cyan' : 'gray'}
        paddingX={2}
        marginX={1}
      >
        <Text bold={selected === idx}>{label}</Text>
      </Box>
    ))}
  </Box>
);
```

### Live Updates
```tsx
const [status, setStatus] = useState(null);

useEffect(() => {
  const interval = setInterval(async () => {
    const data = await fetchStatus();
    setStatus(data);
  }, 5000);

  return () => clearInterval(interval);
}, []);
```

### Loading Spinner
```tsx
import Spinner from 'ink-spinner';

const Loading = () => (
  <Text>
    <Text color="cyan"><Spinner type="dots" /></Text>
    {' Loading...'}
  </Text>
);
```

### Text Input
```tsx
import TextInput from 'ink-text-input';

const [value, setValue] = useState('');

<TextInput
  value={value}
  onChange={setValue}
  onSubmit={() => handleSubmit(value)}
  placeholder="Enter text..."
/>
```

### Select Menu
```tsx
import SelectInput from 'ink-select-input';

<SelectInput
  items={[
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
  ]}
  onSelect={item => handleSelect(item.value)}
/>
```

### Progress Bar
```tsx
const ProgressBar = ({ percent }: { percent: number }) => {
  const width = 30;
  const filled = Math.round((percent / 100) * width);
  return (
    <Box>
      <Text color="cyan">
        [{'█'.repeat(filled)}{'░'.repeat(width - filled)}]
      </Text>
      <Text> {percent}%</Text>
    </Box>
  );
};
```

### Gradient Header
```tsx
import gradient from 'gradient-string';

const header = gradient.rainbow('MY AWESOME APP');
return <Text>{header}</Text>;
```

### Error Display
```tsx
const ErrorBox = ({ error }: { error: string }) => (
  <Box borderStyle="round" borderColor="red" padding={1}>
    <Text color="red" bold>✗ Error</Text>
    <Text>{error}</Text>
  </Box>
);
```

### Success Message
```tsx
const SuccessBox = ({ message }: { message: string }) => (
  <Box borderStyle="round" borderColor="green" padding={1}>
    <Text color="green" bold>✓ Success</Text>
    <Text>{message}</Text>
  </Box>
);
```

---

## 🎨 Color Palette

```tsx
// Status colors
<Text color="green">   // Success, running
<Text color="red">     // Error, stopped
<Text color="yellow">  // Warning, starting
<Text color="blue">    // Info
<Text color="cyan">    // Highlight, headers
<Text color="magenta"> // Special
<Text dimColor>        // Subtle, hints
<Text bold>            // Emphasis
```

---

## 📦 Box Properties

```tsx
<Box
  // Layout
  flexDirection="row"         // row | column
  justifyContent="center"     // flex-start | center | flex-end | space-between | space-around
  alignItems="center"         // flex-start | center | flex-end | stretch

  // Sizing
  width={50}                  // number | string (e.g., "50%")
  height={10}                 // number
  minWidth={20}
  minHeight={5}

  // Spacing
  padding={1}                 // all sides
  paddingX={2}                // horizontal
  paddingY={1}                // vertical
  paddingTop={1}
  paddingBottom={1}
  paddingLeft={1}
  paddingRight={1}
  margin={1}                  // same as padding

  // Border
  borderStyle="round"         // round | single | double | bold | classic
  borderColor="cyan"          // any color

  // Display
  display="flex"              // flex | none
  overflow="hidden"           // visible | hidden
/>
```

---

## ⌨️ Keyboard Input

```tsx
useInput((input, key) => {
  // Arrow keys
  if (key.leftArrow) { }
  if (key.rightArrow) { }
  if (key.upArrow) { }
  if (key.downArrow) { }

  // Special keys
  if (key.return) { }        // Enter
  if (key.escape) { }        // Esc
  if (key.tab) { }
  if (key.backspace) { }
  if (key.delete) { }
  if (key.pageDown) { }
  if (key.pageUp) { }

  // Modifiers
  if (key.ctrl) { }
  if (key.shift) { }
  if (key.meta) { }          // Cmd/Win key

  // Combinations
  if (key.ctrl && input === 'c') { }

  // Letters/numbers
  if (input === 'q') process.exit(0);
});
```

---

## 📊 Common Patterns

### Two-Column Dashboard
```tsx
<Box>
  <Box width="50%" marginRight={1}>
    {/* Left column */}
  </Box>
  <Box width="50%">
    {/* Right column */}
  </Box>
</Box>
```

### Three-Column Layout
```tsx
<Box>
  <Box width="33%" marginRight={1}>Col 1</Box>
  <Box width="33%" marginRight={1}>Col 2</Box>
  <Box width="34%">Col 3</Box>
</Box>
```

### Header + Content + Footer
```tsx
<Box flexDirection="column" height="100%">
  <Box>Header</Box>
  <Box flexGrow={1}>Content</Box>
  <Box>Footer</Box>
</Box>
```

### Centered Box
```tsx
<Box
  height="100%"
  justifyContent="center"
  alignItems="center"
>
  <Text>Centered content</Text>
</Box>
```

### Scrollable List
```tsx
<Box flexDirection="column" height={10} overflow="hidden">
  {items.map(item => (
    <Text key={item.id}>{item.name}</Text>
  ))}
</Box>
```

---

## 🔧 Hooks

```tsx
import {
  useApp,      // App control (exit, etc.)
  useInput,    // Keyboard input
  useStdin,    // Raw stdin access
  useStdout,   // Raw stdout access
  useFocus,    // Focus management
} from 'ink';

// Exit app programmatically
const { exit } = useApp();
exit();

// Get terminal dimensions
const { stdout } = useStdout();
const width = stdout.columns;
const height = stdout.rows;

// Manage focus
const { isFocused } = useFocus({ autoFocus: true });
```

---

## 📦 Package.json Setup

```json
{
  "type": "module",
  "bin": "./dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.tsx",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "ink": "^4.4.1",
    "react": "^18.2.0",
    "ink-text-input": "^5.0.1",
    "ink-select-input": "^6.0.0",
    "ink-spinner": "^5.0.0",
    "chalk": "^5.3.0",
    "gradient-string": "^2.0.2"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/node": "^20.10.5",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

---

## 🎯 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "jsx": "react",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## 🚀 Quick Start Commands

```bash
# Install
npm install ink react ink-text-input ink-select-input ink-spinner chalk gradient-string
npm install -D @types/react @types/node tsx typescript

# Run dev
npx tsx watch src/index.tsx

# Build
npx tsc

# Run production
node dist/index.js
```

---

## 💡 Troubleshooting

**Issue: "Cannot find module 'react'"**
```bash
npm install react
```

**Issue: "JSX syntax error"**
```json
// tsconfig.json
{ "jsx": "react" }
```

**Issue: "Module not found: ink"**
```bash
npm install ink
```

**Issue: "process.stdout is undefined"**
```tsx
// Don't render in non-TTY environments
if (!process.stdout.isTTY) {
  console.log('Not a terminal');
  process.exit(1);
}
```

**Issue: "Text is cut off"**
```tsx
// Add overflow handling
<Box overflow="hidden">
  <Text>{longText}</Text>
</Box>
```

---

## 📚 Resources

- [Ink Docs](https://github.com/vadimdemedes/ink)
- [Full Tutorial](./INK-TUI-TUTORIAL.md)
- [Conversion Prompt](./TUI-CONVERSION-PROMPT.md)
- [LazyCraftLauncher](https://github.com/zaydiscold/LazyCraftLauncher)

---

**Print this and keep it next to your keyboard! 🖨️**
