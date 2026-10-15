# 印象笔记桌面便签 (Evernote Sticky Note for Obsidian)

[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-blue?logo=obsidian)](https://obsidian.md)
[![License: 0-BSD](https://img.shields.io/badge/License-0--BSD-green.svg)](LICENSE)

深度复刻经典版印象笔记（Evernote for Windows）桌面便签交互体验的 Obsidian 插件。融合**拟物桌面悬浮便签纸**与 **Obsidian 原生 Live Preview 实时预览引擎**，既保留了原汁原味的即时便笺手感，又让便签数据无缝作为标准 Markdown 资产沉淀在你的本地知识库中。

---

## 🌟 核心特性

- 🪟 **原生桌面独立悬浮小窗**：脱离主库网格限制，通过独立小窗悬浮在桌面上，随手记录与参考；
- 📌 **真·桌面置顶 (Always on Top)**：基于底层 Electron 窗口能力，一键让便签常驻在所有软件窗口最上层；
- 🎨 **6 款经典拟物便签纸皮肤**：1:1 对齐原版配色（经典黄、薄荷绿、樱花粉、晴空蓝、香芋紫、简约白），并带气泡式即时选色面板；
- 🫧 **工具栏智能居中与自动隐藏**：富文本工具栏绝对水平居中；鼠标移出便签时工具栏自动平滑隐藏，移入时优雅浮现，1:1 复刻 Evernote 极致沉浸感；
- ⚡ **原生 Markdown 实时预览 (Live Preview)**：直接输入 Markdown 语法，标题、列表、复选框即打即显、所见即所得；
- 🛠️ **全套富文本快捷工具栏**：
  - **待办清单 (Checklist)**：插入/切换待办，支持多选内容批量打勾与取消，光标自动定位；
  - **无序列表与有序列表**：支持多选批量转换，有序列表自动按序号递增编号；
  - **删除线**：选中文本一键划线包裹；
  - **插入本地图片**：点击直接拉起资源管理器选图，自动存入 Vault 并生成标准引用；
  - **标题与 YAML 一键显隐**：默认隐藏顶栏多余标题和属性面板，提供独立按钮随需展开；
- 🌐 **原生中英文国际化 (i18n)**：自动识别 Obsidian 系统语言，命令、设置、工具栏与提示无缝切换中文/英文，绝无生硬夹杂；
- 💾 **100% 本地 Markdown 存储**：自动持久化为本地 `.md` 文件，位置、尺寸、皮肤与置顶状态记录于 YAML Frontmatter 中，多端同步无障碍。

---

## 🚀 快速上手

### 1. 手动安装
1. 下载项目构建产物 `main.js`、`styles.css`、`manifest.json`；
2. 在你的 Obsidian 库目录中，找到 `.obsidian/plugins/`，新建文件夹 `obsidian-evernote-stickynote`；
3. 将上述三个文件拷贝到该文件夹中；
4. 在 Obsidian 的「设置」➔「第三方插件」中刷新并启用 **Evernote Sticky Note**。

### 2. 使用方法
- **新建便签**：点击左侧功能栏（Ribbon）的便签纸图标，或按 `Ctrl+P` 输入 `新建桌面便签`；
- **将现有笔记作为便签打开**：在主库文件列表右键任意 `.md` 笔记，选择「以桌面便签打开 (Open as sticky note)」；
- **关闭便签**：点击便签右上角的 `×`，内容已实时自动保存，窗口安全关闭。

---

## 📚 详细文档

- [功能使用说明书 (User Guide)](./docs/user-guide.md)
- [软件开发实施方案与架构设计 (Development Plan)](./docs/development-plan.md)

---

## 🛠️ 本地开发与构建

```bash
# 安装依赖
npm install

# 生产环境打包构建
npm run build

# 代码风格与规范检查
npm run lint
```

---

## 📄 开源许可

本项目遵循 [0-BSD License](LICENSE) 许可开源。
