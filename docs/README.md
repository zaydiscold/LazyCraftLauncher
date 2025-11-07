# LazyCraftLauncher Documentation

Welcome to the comprehensive documentation for LazyCraftLauncher!

---

## 📚 Documentation Index

### 🎨 TUI/Ink Resources

These documents teach you how to build beautiful Terminal UIs like the one in LazyCraftLauncher, and how to convert any CLI project to this style.

1. **[Ink TUI Tutorial](./INK-TUI-TUTORIAL.md)** ⭐ START HERE
   - Complete guide to building React-based Terminal UIs
   - Step-by-step component examples
   - Production-ready patterns from LazyCraftLauncher
   - Advanced techniques (progress bars, tables, tabs)
   - **Perfect for learning Ink from scratch**

2. **[TUI Conversion Prompt](./TUI-CONVERSION-PROMPT.md)** ⭐ REUSABLE TEMPLATE
   - Ready-to-use prompt for converting ANY CLI to beautiful TUI
   - Copy-paste into Claude to upgrade your projects
   - Customization examples for different project types
   - Follow-up prompts for enhancements
   - **Save this prompt - use it for all your CLI projects!**

3. **[Ink Quick Reference](./INK-QUICK-REFERENCE.md)** ⭐ CHEAT SHEET
   - Quick copy-paste snippets
   - All Box properties in one place
   - Keyboard input handling examples
   - Common layout patterns
   - Troubleshooting guide
   - **Keep this open while coding!**

---

## 🚀 Quick Start Guides

### I want to learn Ink/TUI development
→ Read [INK-TUI-TUTORIAL.md](./INK-TUI-TUTORIAL.md) from start to finish

### I want to convert my existing CLI to use this style
→ Use the prompt from [TUI-CONVERSION-PROMPT.md](./TUI-CONVERSION-PROMPT.md)

### I'm already building with Ink and need quick reference
→ Keep [INK-QUICK-REFERENCE.md](./INK-QUICK-REFERENCE.md) open in a tab

### I want to understand LazyCraftLauncher's architecture
→ Read [CLAUDE.md](../CLAUDE.md) for complete technical docs

---

## 📖 What Each Document Contains

### INK-TUI-TUTORIAL.md
```
✓ Installation & setup
✓ Basic layout with boxes
✓ Interactive buttons with arrow keys
✓ Live status updates
✓ Multi-step wizards
✓ Gradient banners
✓ Progress bars, tables, tabs
✓ Complete example app
✓ Styling tips & advanced patterns
✓ Real-world examples from this codebase
```

### TUI-CONVERSION-PROMPT.md
```
✓ Universal conversion prompt (copy-paste ready)
✓ How to customize for your project
✓ Project-specific additions (web servers, build tools, etc.)
✓ Follow-up enhancement prompts
✓ Success story template
✓ Pro tips for working with Claude
```

### INK-QUICK-REFERENCE.md
```
✓ All component snippets
✓ Color palette
✓ Box property reference
✓ Keyboard input patterns
✓ Common layout examples
✓ Hooks documentation
✓ Package.json setup
✓ Troubleshooting
```

---

## 🎯 Use Cases

### "I want to build a monitoring dashboard for my app"
1. Read the **Layout** section in [INK-TUI-TUTORIAL.md](./INK-TUI-TUTORIAL.md#-core-components)
2. Copy the **LiveStatus** component example
3. Use [INK-QUICK-REFERENCE.md](./INK-QUICK-REFERENCE.md#live-updates) for quick tweaks

### "I have a CLI tool that needs a setup wizard"
1. Use the **Wizard** section in [INK-TUI-TUTORIAL.md](./INK-TUI-TUTORIAL.md#4-multi-step-wizard)
2. Customize with [INK-QUICK-REFERENCE.md](./INK-QUICK-REFERENCE.md#text-input)

### "I want to upgrade my entire CLI project"
1. Copy the prompt from [TUI-CONVERSION-PROMPT.md](./TUI-CONVERSION-PROMPT.md#the-prompt-copy-everything-below)
2. Add your project specifics
3. Paste into Claude
4. Iterate with follow-up prompts from the same doc

### "I forgot how to do arrow key navigation"
→ [INK-QUICK-REFERENCE.md](./INK-QUICK-REFERENCE.md#button-row)

### "How do I make a progress bar?"
→ [INK-QUICK-REFERENCE.md](./INK-QUICK-REFERENCE.md#progress-bar)

### "What are all the Box properties?"
→ [INK-QUICK-REFERENCE.md](./INK-QUICK-REFERENCE.md#-box-properties)

---

## 💡 Learning Path

**Beginner** (Never used Ink before)
```
1. Read INK-TUI-TUTORIAL.md sections:
   - Installation
   - Basic Layout with Boxes
   - Styling Tips

2. Build the "Complete Example App"

3. Keep INK-QUICK-REFERENCE.md open for syntax
```

**Intermediate** (Know some Ink basics)
```
1. Skim INK-TUI-TUTORIAL.md advanced sections:
   - Interactive Buttons
   - Live Status Updates
   - Multi-Step Wizard

2. Study LazyCraftLauncher source:
   - src/ui/Dashboard.tsx
   - src/ui/components/StatusPanel.tsx

3. Use INK-QUICK-REFERENCE.md as needed
```

**Advanced** (Building production TUI)
```
1. Reference INK-TUI-TUTORIAL.md advanced patterns:
   - Progress bars
   - Tables
   - Tabs

2. Study CLAUDE.md for architecture patterns

3. Use TUI-CONVERSION-PROMPT.md to help others
```

---

## 🎨 The "LazyCraft Style" Philosophy

The TUI style used in LazyCraftLauncher follows these principles:

1. **Visual Hierarchy**
   - Clear borders separate different info sections
   - Color-coding communicates status at a glance
   - Consistent spacing creates breathing room

2. **Interactive & Responsive**
   - Arrow keys feel natural
   - Visual feedback on selection (bold + color)
   - Live updates without flickering

3. **Information Density**
   - Everything important visible at once
   - No scrolling required for main info
   - Tips/help text always accessible

4. **Professional Polish**
   - Gradient headers add personality
   - Rounded borders feel modern
   - Proper alignment and padding

5. **Keyboard-First**
   - All actions via keyboard
   - Shortcuts for power users
   - Clear hints for discoverability

**These docs teach you how to achieve all of this!**

---

## 🔗 External Resources

- [Ink GitHub](https://github.com/vadimdemedes/ink) - Official Ink repository
- [Ink Examples](https://github.com/vadimdemedes/ink/tree/master/examples) - More examples
- [React Docs](https://react.dev/) - React fundamentals (Ink uses React)
- [LazyCraftLauncher Repo](https://github.com/zaydiscold/LazyCraftLauncher) - This project!

---

## 🤝 Contributing

Found an issue or have suggestions for these docs?
- Open an issue on GitHub
- Submit a PR with improvements
- Share your own Ink creations!

---

## 📝 License

These documentation files are MIT licensed, just like LazyCraftLauncher.
Feel free to use, modify, and share!

---

## ⭐ Quick Links

| I want to... | Go to... |
|-------------|----------|
| Learn Ink from scratch | [INK-TUI-TUTORIAL.md](./INK-TUI-TUTORIAL.md) |
| Convert my CLI project | [TUI-CONVERSION-PROMPT.md](./TUI-CONVERSION-PROMPT.md) |
| Look up syntax quickly | [INK-QUICK-REFERENCE.md](./INK-QUICK-REFERENCE.md) |
| Understand the architecture | [CLAUDE.md](../CLAUDE.md) |
| See example code | [src/ui/](../src/ui/) |

---

**Happy TUI building! 🎨✨**

*Made with ❤️ for the CLI community*
