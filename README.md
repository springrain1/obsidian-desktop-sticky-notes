# Desktop Stickies for Obsidian

English | [中文](README_cn.md)

[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-blue?logo=obsidian)](https://obsidian.md)
[![Release](https://img.shields.io/badge/Release-v1.3.0-green.svg)](https://github.com/springrain1/obsidian-desktop-sticky-notes/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Desktop Stickies** is a skeuomorphic desktop sticky notes plugin designed specifically for Obsidian. Combining the tactile immediacy of classic desktop post-it notes with **Obsidian's native Live Preview engine**, it keeps all your thoughts directly visible on your desktop while saving everything neatly into your local Markdown vault.

---

## 🌟 Key Features (v1.3.0)

- ⚓ **True Desktop Widget Mode**:
  - Three-state physical Z-order cycling: `Floating` ➔ `Pinned (Topmost)` ➔ `Desktop Widget` ➔ `Floating`;
  - Embedded into the Windows desktop shell (Progman), **immune to `Win+D` (Show Desktop) minimizing, remaining permanently pinned to your wallpaper**;
  - Full CodeMirror 6 markdown editing on desktop; automatically resets to the bottom layer (`HWND_BOTTOM`) on blur, never getting in the way of other apps.
- 📐 **Slim Borders & Customizable Padding**:
  - Settings slider for vertical padding (0~30px) and horizontal padding (0~30px);
  - When set to `0`, removes line-width limits and scrollbar gutters, allowing text to seamlessly touch the very edge for an ultra-compact look;
  - Instant live broadcast preview when adjusting sliders.
- 🤫 **Distraction-Free Window Closing**:
  - Closing a sticky note directly closes the popup window without activating Obsidian's main window, eliminating unwanted window popups.
- 🎨 **Full Charcoal Dark Theme Compatibility**:
  - **2px Bright White Caret**: Cursor is clearly visible against dark backgrounds without needing text selection;
  - **Native Dark Pipeline Activation**: Automatically switches window context to `theme-dark`;
  - **Comprehensive Syntax Compatibility**: Tables (headers & cells), Callouts (including neutral quote style), unresolved internal links (`is-unresolved`), blockquotes, LaTeX math, and code blocks all render with crisp contrast.
- 🪟 **Hide Center Formatting Toolbar**:
  - Optional toggle to hide formatting buttons in the center of the toolbar, creating a large, seamless drag-handle area for effortless repositioning.
- 💾 **Precise Bounds & Dimension Persistence**:
  - Window dimensions are restored 1:1 without frame-expansion drift;
  - Native Electron `move` listener records coordinates silently 500ms after dragging stops;
  - Disconnected secondary monitor auto-recovery keeps notes safely visible.
- 🧹 **Anti-Clutter Taskbar Skipping**: Sticky note windows are hidden from the OS taskbar, leaving only your main Obsidian icon.
- 🗂️ **Sticky Notes Hub**: Search, filter, and resurrect archived or closed sticky notes in a unified card grid.
- 🌈 **7 Skeuomorphic Paper Skins**: Classic Yellow, Mint Green, Sakura Pink, Sky Blue, Taro Purple, Minimal White, and Charcoal Dark.
- 🔄 **Restore to Main Window**: One-click command to dock floating notes back into main vault editor tabs.

---

## 🚀 Quick Start

### 1. Manual Installation
1. Download `main.js`, `styles.css`, and `manifest.json` from the latest [GitHub Release](https://github.com/springrain1/obsidian-desktop-sticky-notes/releases);
2. In your Obsidian vault folder, navigate to `.obsidian/plugins/` and create a directory named `desktop-stickies`;
3. Copy the three downloaded files into that folder;
4. Open **Obsidian Settings** ➔ **Community plugins**, reload, and enable **Desktop Stickies**.

### 2. Basic Usage
- **New Sticky Note**: Click the sticky note icon on the left Ribbon, or press `Ctrl+P` and search `New desktop sticky note`;
- **Open Notes Hub**: Click the grid icon on the left Ribbon, or search `Open desktop sticky notes hub`;
- **Open Any Note as Sticky**: Right-click any note in your file explorer and choose `Open as desktop sticky note`;
- **Cycle Window State**: Click the 📌 icon on the left of the toolbar to cycle between Floating, Pinned, and Desktop Widget;
- **Close Note**: Click `×` in the top right corner. Content is saved silently in real time, and the window closes smoothly without interrupting other applications.

---

## 🛠️ Development & Build

```bash
# Install dependencies
npm install

# Production build
npm run build

# Code linting
npm run lint
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Copyright (c) 2025-2026 springrain.
