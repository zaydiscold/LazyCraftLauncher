# 🎨 Universal TUI Conversion Prompt

## Copy-paste this prompt to convert ANY CLI project to beautiful Ink-based TUI

---

## THE PROMPT (Copy everything below)

```
I want to convert this CLI project to use a beautiful Terminal User Interface (TUI) using Ink (React for terminals).

The style I want is inspired by LazyCraftLauncher - featuring:
- Beautiful bordered boxes with rounded corners
- Two-column dashboard layout (Status on left, Info on right)
- Interactive arrow-key navigation for buttons/options
- Live status updates with spinners
- Color-coded indicators (green for success, red for errors, yellow for warnings)
- Gradient headers/banners
- Professional spacing and padding

Here's what I need you to do:

1. **Install Dependencies:**
   - Add ink, react, ink-box, ink-text-input, ink-select-input, ink-spinner
   - Add chalk and gradient-string for styling
   - Set up TypeScript with React JSX support

2. **Create the Core Structure:**
   - Main app component with state management
   - Dashboard component with two-column layout using flexbox
   - Status panel (left) showing:
     - Current status with colored indicator (● Running / ○ Stopped)
     - Uptime
     - Any relevant metrics
     - Last log message
   - Info panel (right) showing:
     - Connection/address info
     - Configuration details
     - Tips or help text

3. **Add Interactive Elements:**
   - Action buttons at the bottom (e.g., Restart, Backup, Stop)
   - Arrow key navigation (← → to switch between buttons)
   - Enter key to execute selected action
   - Visual highlighting for selected button (bold border + color)

4. **Implement Live Updates:**
   - Use useEffect with intervals to poll status every 5 seconds
   - Update dashboard panels in real-time
   - Show spinners during loading states

5. **Add Visual Polish:**
   - Gradient banner/header at top
   - Rounded borders (`borderStyle="round"`)
   - Color-coded borders based on status
   - Proper spacing with margin and padding
   - Keyboard shortcut hints at bottom

6. **File Structure:**
   ```
   src/
   ├── index.tsx              # Entry point, renders main app
   ├── App.tsx                # Main app with state management
   ├── components/
   │   ├── Banner.tsx         # Gradient header
   │   ├── Dashboard.tsx      # Main dashboard layout
   │   ├── StatusPanel.tsx    # Left panel - status info
   │   ├── InfoPanel.tsx      # Right panel - connection/config
   │   └── ActionButtons.tsx  # Interactive button row
   └── utils/
       └── status.ts          # Status fetching logic
   ```

7. **Styling Guidelines:**
   - Use Box component for layouts (flexDirection, padding, margin)
   - Use borderStyle="round" for all panels
   - Color scheme:
     - Cyan for headers and highlights
     - Green for success/running states
     - Red for errors/stopped states
     - Yellow for warnings/starting states
     - Gray/dimColor for secondary text
   - Consistent spacing: padding={1}, margin={1}

8. **Keyboard Controls:**
   - Arrow keys (← →) to navigate buttons
   - Enter to execute selected action
   - Q or Esc to quit (with confirmation)
   - Any additional shortcuts relevant to the app

9. **Preserve Existing Functionality:**
   - Keep all existing CLI logic and features
   - Integrate the TUI as a new interface layer
   - Maintain compatibility with --help and other flags
   - Don't break existing APIs or behavior

10. **Example Layout:**
    ```
    ╔═══════════════════════════════════════════╗
    ║        MY APPLICATION NAME                 ║
    ║        "Tagline here"                      ║
    ╔═══════════════════════════════════════════╗

    ┌────────────────────┐ ┌────────────────────┐
    │ Status             │ │ Connection Info    │
    │                    │ │                    │
    │ ● Running          │ │ Address: X.X.X.X   │
    │ Uptime: 2h 15m     │ │ Port: XXXX         │
    │ Metric: Value      │ │ Status: Active     │
    │                    │ │                    │
    │ Last log:          │ │ Tips:              │
    │ [timestamp] msg    │ │ • Tip 1            │
    └────────────────────┘ │ • Tip 2            │
                           └────────────────────┘

    ┌─────────┐ ┌────────┐ ┌──────┐
    │ Action1 │ │ Action2│ │ Quit │
    └─────────┘ └────────┘ └──────┘

    ← → Navigate  ↵ Execute  Q Quit
    ```

Please implement this TUI conversion while:
- Maintaining all existing functionality
- Using TypeScript with proper types
- Following React best practices
- Adding comments explaining the layout structure
- Providing a README section on how to use the new TUI

Reference implementation: https://github.com/zaydiscold/LazyCraftLauncher
Key files to study:
- src/ui/Dashboard.tsx
- src/ui/components/StatusPanel.tsx
- src/ui/components/ActionButtons.tsx
```

---

## 📝 How to Use This Prompt

1. **Copy the entire prompt above** (from "I want to convert..." to the end)

2. **Add context about your specific project:**
   ```
   My CLI project is a [description].
   Currently it has these features: [list features]
   The main commands are: [list commands]
   ```

3. **Paste into Claude** and let it work!

4. **Customize after conversion:**
   - Adjust colors to match your brand
   - Add/remove panels based on your needs
   - Customize button actions
   - Add project-specific status indicators

---

## 🎯 Quick Customization Examples

### Change Color Scheme
```tsx
// Replace cyan with your brand color
<Box borderColor="purple">  // instead of "cyan"
<Text color="magenta">      // instead of "cyan"
```

### Add More Panels
```tsx
{/* Add a third column */}
<Box width="33%">
  <Box borderStyle="round" padding={1}>
    <Text>Extra Info</Text>
  </Box>
</Box>
```

### Add More Buttons
```tsx
const buttons = [
  { label: 'Start', color: 'green' },
  { label: 'Stop', color: 'red' },
  { label: 'Restart', color: 'yellow' },
  { label: 'Logs', color: 'blue' },    // ← New button
];
```

### Add Keyboard Shortcuts
```tsx
useInput((input, key) => {
  if (input === 'l') showLogs();        // Press 'L' for logs
  if (input === 'r') restart();         // Press 'R' for restart
  if (input === 'b') backup();          // Press 'B' for backup
});
```

---

## 🔧 Project-Specific Additions

### For Web Servers
Add to the prompt:
```
Additionally, show:
- Request count per minute
- Active connections
- Response time metrics
- Error rate with color coding
```

### For Build Tools
Add to the prompt:
```
Additionally, show:
- Build progress with progress bar
- File watching status
- Last compilation time
- Error/warning counts
```

### For Database Tools
Add to the prompt:
```
Additionally, show:
- Connection status
- Query performance metrics
- Active connections
- Database size
```

### For API Clients
Add to the prompt:
```
Additionally, show:
- API endpoint status
- Rate limit remaining
- Last request time
- Response codes breakdown
```

---

## 💡 Pro Tips

1. **Always mention "inspired by LazyCraftLauncher"** - Claude will recognize the reference and match the style

2. **Be specific about your metrics** - Tell Claude exactly what status info you want to display

3. **Request TypeScript types** - Always ask for properly typed components

4. **Ask for comments** - Request inline comments explaining the layout logic

5. **Iterate** - Start with basic layout, then ask Claude to add features incrementally

---

## 🎨 Example Follow-up Prompts

After the initial conversion, use these to enhance:

```
"Add a loading animation with spinners when the status is updating"
```

```
"Add a logs panel that shows the last 10 log lines with syntax highlighting"
```

```
"Add a keyboard shortcut overlay that appears when I press '?'"
```

```
"Add an error panel that appears at the top when there's an issue"
```

```
"Add animation when switching between tabs"
```

```
"Add a progress bar showing [specific metric]"
```

---

## 📚 Resources

- [Full Ink Tutorial](./INK-TUI-TUTORIAL.md)
- [Ink GitHub](https://github.com/vadimdemedes/ink)
- [LazyCraftLauncher Source](https://github.com/zaydiscold/LazyCraftLauncher)

---

## ✨ Example Success Stories

Copy this format when sharing your TUI conversions:

```
Before: Basic CLI with console.log
After: Beautiful TUI with:
- Live status dashboard
- Interactive controls
- Color-coded indicators
- Professional layout

Conversion time: ~30 minutes with Claude
Lines of code added: ~500
User experience improvement: 🚀🚀🚀
```

---

**Save this prompt and use it for ALL your future CLI projects!** 🎉
