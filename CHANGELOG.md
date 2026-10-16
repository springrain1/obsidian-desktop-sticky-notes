# Changelog

English | [中文](CHANGELOG_cn.md)

All notable changes to the **Desktop Stickies** plugin will be documented in this file.
This project adheres to [Semantic Versioning 2.0.0](https://semver.org/).

---

## [1.3.0] - 2026-10-16

### 🌟 New Features
- **True Desktop Widget Mode**:
  - Three-state physical Z-order cycling: `Floating` ➔ `Pinned (Topmost)` ➔ `Desktop Widget` ➔ `Floating`;
  - Embedded into the Windows desktop shell (Progman), **immune to `Win+D` (Show Desktop) minimizing, remaining permanently pinned to your wallpaper**;
  - Full CodeMirror 6 markdown editing on desktop; automatically resets to the bottom layer (`HWND_BOTTOM`) on blur, never getting in the way of other apps.
- **Slim Borders & Customizable Content Padding**:
  - Settings slider for vertical padding (0~30px) and horizontal padding (0~30px);
  - When set to `0`, removes line-width limits and scrollbar gutters, allowing text to seamlessly touch the very edge for an ultra-compact look;
  - Instant live broadcast preview when adjusting sliders.
- **Hide Center Formatting Toolbar**:
  - Optional toggle to hide formatting buttons in the center of the toolbar, creating a large, seamless drag-handle area for effortless repositioning.

### 🐞 Bug Fixes
- **Distraction-Free Window Closing**:
  - Closing a sticky note directly closes the popup window without activating Obsidian's main window, eliminating unwanted window popups.
- **Full Charcoal Dark Theme Compatibility**:
  - **2px Bright White Caret**: Cursor is clearly visible against dark backgrounds without needing text selection;
  - **Native Dark Pipeline Activation**: Automatically switches window context to `theme-dark`;
  - **Comprehensive Syntax Compatibility**: Tables (headers & cells), Callouts (including neutral quote style), unresolved internal links (`is-unresolved`), blockquotes, LaTeX math, and code blocks all render with crisp contrast.
- **Precise Bounds & Dimension Persistence**:
  - Window dimensions are restored 1:1 without frame-expansion drift;
  - Secondary repositioning reliably reapplies custom heights (e.g. 250px) without being overwritten by defaults;
  - Native Electron `move` listener records coordinates silently 500ms after dragging stops;
  - Disconnected secondary monitor auto-recovery keeps notes safely visible.
- **Local Datetime Format**: New notes record `created_at` in `YYYY-MM-DD HH:mm:ss` local time, eliminating confusing 8-hour UTC offsets and integrating smoothly with Properties & Dataview.

### ⚡ Refactoring & Performance
- **Net reduction of 85 redundant lines**:
  - Replaced bulky singleton classes and simulated types with clean typed exports;
  - Lazy initialization for the Win32 worker process (zero overhead when widget mode is unused);
  - Consolidated popout leaf filtering via generator function (DRY refactoring);
  - Cleaned up obsolete dock keys and redundant CSS inheritance declarations;
  - Proper timer cleanup on plugin unload.

---

## [1.2.0] - 2026-10-16
- Plugin ID renamed to `desktop-stickies`;
- Silent physical coordinate persistence & multi-monitor clamping;
- Added Restore to Main Window feature;
- Added pin button cycling mode settings.

---

## [1.1.0] - 2026-10-15
- Taskbar anti-clutter skip feature;
- Added Charcoal Dark paper skin;
- Switched license to MIT License.

---

## [1.0.0] - 2026-10-14
- Initial release: Standalone popout windows, Live Preview editing, rich-text toolbar, 7 skeuomorphic paper skins, and Notes Hub.
