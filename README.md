# Desktop Stickies for Obsidian

English | [中文](README_cn.md)

[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-blue?logo=obsidian)](https://obsidian.md)
[![Release](https://img.shields.io/badge/Release-v1.3.0-green.svg)](https://github.com/springrain1/obsidian-desktop-sticky-notes/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Desktop Stickies** is a modern skeuomorphic desktop sticky notes plugin designed specifically for Obsidian. Combining the tactile immediacy of classic desktop post-it notes with **Obsidian's native Live Preview engine**, it keeps all your thoughts directly visible on your desktop while saving everything neatly into your local Markdown vault.

---

## 🌟 Comprehensive Features

### 🪟 1. Standalone Popout Windows & Three-State Physical Z-Order
- **Native Floating Windows**: Free from main window pane splits—each sticky note is a dedicated, draggable, resizable OS-level window;
- **⚓ True Desktop Widget Mode**:
  - Embedded into the Windows desktop shell (Progman), **immune to `Win+D` (Show Desktop) minimizing, remaining permanently pinned to your wallpaper**;
  - Full CodeMirror 6 markdown editing on desktop; automatically resets to the bottom layer (`HWND_BOTTOM`) on blur, never getting in the way of other apps;
- **📌 Always-on-Top Pinned Mode**: Keep notes floating on top of all application windows for quick cross-referencing and meeting minutes;
- **Single-Button Three-State Cycling**: Seamlessly cycle between `Floating` ➔ `Pinned (Topmost)` ➔ `Desktop Widget` via the toolbar pin icon (classic two-state toggle also available in settings);
- **📐 Slim Borders & Customizable Padding**:
  - Settings slider for vertical padding (0~30px) and horizontal padding (0~30px);
  - When set to `0`, removes line-width limits and scrollbar gutters, allowing text to seamlessly touch the very edge for an ultra-compact look;
- **🤫 Distraction-Free Window Closing**: Closing a note directly closes the popup window without activating Obsidian's main window, eliminating unwanted window popups;
- **🧹 Anti-Clutter Taskbar Skipping**: Sticky note windows are hidden from the OS taskbar, leaving only your main Obsidian icon;
- **🔄 Restore to Main Window**: One-click command to dock floating notes back into main vault editor tabs;
- **💾 Precise Bounds & Dimension Persistence**:
  - Window dimensions are restored 1:1 without frame-expansion drift;
  - Native Electron `move` listener records coordinates silently 500ms after dragging stops;
  - Disconnected secondary monitor auto-recovery keeps notes safely visible.

### ✍️ 2. Native Live Preview & Rich-Text Toolbar
- **WYSIWYG Live Preview**: Direct markdown editing—headings, checklists, math equations, and highlights render immediately with native cursor focus;
- **🛠️ Full Rich-Text Quick Toolbar**:
  - **Checklists**: Toggle checkboxes with multi-line selection support for batch checking/unchecking;
  - **Smart Lists**: One-click bullet lists and auto-incrementing numbered lists (1. 2. 3...);
  - **Strikethrough**: One-click text wrapping with `~~strikethrough~~`;
  - **Insert Local Images**: Open OS file picker directly, auto-saving images into vault attachments and inserting standard markdown links;
  - **Toggle Title & YAML**: Keep clean notes by hiding titles and frontmatter properties by default, expandable on demand;
- **🪟 Hide Center Formatting Toolbar**: Optional toggle to hide formatting buttons in the center of the toolbar, creating a large, seamless drag-handle area for effortless repositioning.

### 🎨 3. Skeuomorphic Paper Skins & Dark Mode
- **7 Skeuomorphic Paper Skins**: Classic Yellow, Mint Green, Sakura Pink, Sky Blue, Taro Purple, Minimal White, and Charcoal Dark;
- **🌑 Full Charcoal Dark Theme Compatibility**:
  - **2px Bright White Caret**: Cursor is clearly visible against dark backgrounds without needing text selection;
  - **Native Dark Pipeline Activation**: Automatically switches window context to `theme-dark`;
  - **Comprehensive Syntax Compatibility**: Tables (headers & cells), Callouts (including neutral quote style), unresolved internal links (`is-unresolved`), blockquotes, LaTeX math, and code blocks all render with crisp contrast;
- **🫧 Auto-Hide Toolbar on Cursor Leave**: Smoothly fades out when the mouse leaves for a distraction-free paper note experience, gliding back when hovered.

### 🗂️ 4. Sticky Notes Hub & Data Safety
- **Sticky Notes Hub**: Modal manager featuring a masonry card grid of all your sticky notes, with live search filtering, previewing, and resurrection;
- **💾 100% Local Markdown Storage**: No cloud lock-in—every sticky note is saved as a plain `.md` file with position, dimensions, skin color, and window mode tracked in YAML Frontmatter, natively compatible with Obsidian Sync, Git, or cloud drives;
- **🌐 Native Internationalization (i18n)**: Automatically detects system language, switching commands, settings, tooltips, and notices between English and Chinese.

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
- **Close Note**: Click `×` in the top right corner. Content is saved silently in real time, and the window closes smoothly without interrupting other applications;
- **Delete Note**: Click the `🗑️` trash icon in the toolbar to safely move the note to trash.

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
