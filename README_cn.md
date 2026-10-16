# 桌面便笺 (Desktop Stickies for Obsidian)

[English](README.md) | 中文

[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-blue?logo=obsidian)](https://obsidian.md)
[![Release](https://img.shields.io/badge/Release-v1.3.0-green.svg)](https://github.com/springrain1/obsidian-desktop-sticky-notes/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Desktop Stickies** 是一款专为 Obsidian 打造的现代化拟物风独立桌面便笺插件。融合**经典纸质桌面便笺交互**与 **Obsidian 原生 Live Preview 实时预览引擎**，既保留了桌面便笺即开即写、常驻桌面的轻量手感，又让所有灵感数据无缝沉淀在你的本地 Markdown 知识库中。

---

## 🌟 核心特性 (v1.3.0)

- ⚓ **真·桌面小组件模式 (Desktop Widget)**：
  - 升级三态物理空间流转：`普通浮动 (Float)` ➔ `窗口置顶 (Pin)` ➔ `桌面小组件 (Widget)` ➔ `普通浮动 (Float)`；
  - 挂载系统桌面宿主（Progman），**按 `Win+D`（显示桌面）时所有普通软件最小化，便签稳稳留在壁纸上常驻**；
  - 保持完整 CodeMirror 编辑能力，在桌面上直接打字打勾；写完鼠标切回其他软件，便签自动平滑沉底（`HWND_BOTTOM`），绝不遮挡后续工作。
- 📐 **极窄边框与间距自由调节**：
  - 设置面板提供「正文上下间距（0~30px）」与「正文左右间距（0~30px）」滑块；
  - 调为 `0` 时，通过 API 级拔除行宽限制并清空滚动槽位，**文字真正从最左侧第 0 像素贴边延展至最右侧边缘，实现极限窄边框**；
  - 滑块拖拽实时无刷新广播响应，即拖即见效。
- 🤫 **关闭便签绝对零打扰**：
  - 随手点击右上角关闭（✕）或删除时，直接关闭独立宿主窗口，**彻底解决此前因焦点补偿导致庞大的 Obsidian 主窗口突然弹跳置顶打扰工作的顽疾**。
- 🎨 **暗夜极客模式 (Charcoal) 语法全兼容**：
  - **光标 2px 耀眼亮白**：光标与输入点全链路绑定明亮文字色，告别深黑背景下光标隐形消失；
  - **动态深色渲染管线**：切换暗色便签时自动切换宿主窗口的主题上下文（`theme-dark`）；
  - **全套排版语法高对比度呈现**：表格（表头与单元格）、Callout 标注块（含中性灰 quote 类型）、未创建内部双链（`is-unresolved`）、引用块、LaTeX 数学公式、代码块全部赋予明亮高对比度呈现，告别“黑底写黑字”。
- 🪟 **中间格式工具栏隐藏开关**：
  - 设置面板提供开关，一键隐藏中间格式化按钮；隐藏后顶部整条大面积区域直接作为拖拽抓手，随手一抓即可移动便签。
- 💾 **历史坐标与尺寸 1:1 绝对精准记忆**：
  - 二次定位强力注入内容尺寸，用户自定义的历史高度（如 250px）在下一次打开时 100% 绝对 1:1 复原；
  - 尺寸采集严格基于内容区，彻底消除开合循环外边框膨胀；
  - 监听原生 Electron `move` 事件，真正做到拖拽松手 500ms 静默存盘；外接副屏拔除后自动拉回主屏视野。
- 🧹 **任务栏防拥挤 (Skip Taskbar)**：便签小窗不占用系统任务栏位置，仅保留一个主程序图标，保持桌面清爽。
- 🗂️ **桌面便笺管理器 (Notes Hub)**：主库一键唤出便笺管理器，瀑布流卡片检索所有历史便笺，支持关键字即时过滤与重新唤醒。
- 🌈 **7 款经典拟物纸质皮肤**：经典黄、薄荷绿、樱花粉、晴空蓝、香芋紫、简约白，以及专为深色模式打造的暗夜碳黑。
- 🔄 **收回收纳至主库**：提供「恢复为主窗口」按钮，一键将便签收回到 Obsidian 主库的 Tab 标签页。

---

## 🚀 快速上手

### 1. 手动安装
1. 下载 Release 页面发布的 `main.js`、`styles.css`、`manifest.json`；
2. 在您的 Obsidian 库目录中，进入 `.obsidian/plugins/`，新建文件夹 `desktop-stickies`；
3. 将上述三个文件拷贝到该文件夹中；
4. 在 Obsidian 的「设置」➔「第三方插件」中刷新并启用 **Desktop Stickies**。

### 2. 常用操作
- **新建便笺**：点击左侧 Ribbon 的便签纸图标，或按 `Ctrl+P` 输入 `新建桌面便笺`；
- **打开管理器**：点击左侧 Ribbon 的网格图标，或按 `Ctrl+P` 输入 `打开桌面便笺管理器`；
- **以便笺打开现有笔记**：右键任意笔记，选择「以桌面便笺打开」；
- **切换形态**：点击工具栏左侧的 📌 按钮，在普通浮动、窗口置顶、桌面小组件之间自由循环；
- **关闭便笺**：点击便笺右上角的 `×`，内容已实时落盘，窗口自然退出且不打扰前台工作。

---

## 🛠️ 本地构建

```bash
# 安装依赖
npm install

# 生产编译
npm run build

# 规范检查
npm run lint
```

---

## 📄 开源许可

本项目遵循 [MIT License](LICENSE) 许可开源。
Copyright (c) 2025-2026 springrain.
