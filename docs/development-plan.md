# 桌面便笺 (Desktop Sticky Notes) 软件开发实施方案

---

## 一、 项目背景与逆向工程分析

### 1. 项目背景
桌面便笺作为广受用户喜爱的轻量记录形态，核心优势在于：窗口小巧独立、常驻置顶、拟物纸质底色、所见即所得富文本交互。
而在 Obsidian 生态中，普通笔记通常受限于主界面的网格窗格（Splits），虽然官方提供了 `Popout Window` 弹窗能力，但缺乏原汁原味的便笺交互外壳、全局置顶机制、集中便笺管理器与快捷便笺工具栏。
本项目命名为 **Desktop Sticky Notes（桌面便笺）**，旨在：**打造一款兼具经典便笺拟物手感与现代 Obsidian Markdown 知识体系的社区标杆插件。**

### 2. 经典客户端逆向工程与设计参考
通过对 Windows 传统客户端与现代 Windows 11 便笺（Sticky Notes）的核心架构剖析：
- **核心交互模型**：
  - 独立无边框弹窗与置顶常驻；
  - 7 款经典与暗夜碳黑便笺纸配色体系；
  - 顶栏常用操作链：新建、置顶、换肤、待办 Checklist、列表、编号、划线、选图插入；
  - 便笺管理器（Sticky Notes Hub）与卡片瀑布流检索；
  - 明确分离“关闭桌面小窗（Hide）”与“移入废纸篓（Delete）”的双层生命周期。

---

## 二、 架构设计与技术选型

### 1. 架构演进与方案选型
在开发过程中，针对“富文本与 Markdown 兼容”经历了两次深度方案论证：

- **方案 A（自制富文本 DOM 容器 + 双向转换适配器）**：
  在 `ItemView` 内部使用 HTML `contenteditable` 容器，保存时转换回 Markdown。
  *缺陷*：脱离了 Obsidian 核心的 CodeMirror 6 编辑器上下文，无法享受 Obsidian 社区丰富的语法高亮、Wiki 链接、拼写检查以及实时预览交互。
- **方案 B（推荐并最终落地：直接承载原生 `MarkdownView` / Live Preview）**：
  在桌面 Popout Leaf 中直接运行 Obsidian 原生 `MarkdownView`（开启 Live Preview 模式），并在其外层挂载拟物便笺外壳、悬浮工具栏和 7 色便笺皮肤。
  *优势*：
  1. **100% 实时预览**：原生 CM6 即打即显，输入 Markdown 语法（如 `- [ ] `、`**`）瞬间原地呈现为富文本复选框或高亮文字；
  2. **生态完全同源**：插件仅 25KB，零重型第三方黑盒依赖；
  3. **富文本工具全面可用**：通过 Obsidian 标准 `Editor` API，工具栏按钮直接驱动编辑器选区与行前缀。

### 2. 系统整体架构拓扑图

```
┌─────────────────────────────────────────────────────────────┐
│             Obsidian 宿主 (Electron / Workspace)            │
├──────────────────────────────┬──────────────────────────────┤
│     独立桌面窗口生命周期       │       便笺数据持久层 (Vault)   │
│   (StickyWindowManager)      │   - 对应 StickyNotes/*.md    │
│  - openPopoutLeaf 独立视窗   │   - YAML Frontmatter 配置状态│
│  - Electron setAlwaysOnTop   │     (color, pinned, bounds)  │
│  - 彻底屏蔽顶部 Tab 标签栏   │   - 库内图片附件统一管理     │
│  - 屏幕越界安全保护机制      │                              │
├──────────────────────────────┴──────────────────────────────┤
│             CodeMirror 6 (Live Preview) 原生编辑内核        │
│  - 所见即所得实时渲染 (Checklist, Bullet, Number, Bold)     │
│  - 纯 CSS 变量穿透便笺纸底色与文字色彩                     │
│  - 紧凑留白重置 (消除多余的顶部空隙)                        │
├─────────────────────────────────────────────────────────────┤
│             悬浮工具栏组件 (DesktopStickyToolbar)           │
│  - 快捷操作：[+] [置顶] [调色盘(7色)]                       │
│  - 富文本组：[待办] [无序列表] [有序列表] [删除线] [选图插入]│
│  - 视图控制：[标题显示/隐藏] [YAML显示/隐藏]                 │
│  - 窗口管理：[🗑️ 移入废纸篓] [× 关闭悬浮小窗]               │
├─────────────────────────────────────────────────────────────┤
│             便笺列表管理器 (StickyNotesHubModal)            │
│  - 瀑布流卡片网格展示、即时搜索过滤、双击重新唤醒桌面小窗   │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、 核心技术难点攻坚与实现方案

### 1. 操作系统级桌面独立小窗与置顶 (Always on Top)
调用 Obsidian 官方的 `app.workspace.openPopoutLeaf({ size })`，使便笺作为独立的 Electron `BrowserWindow` 弹出。
为了跨平台与安全调用 Electron 窗口置顶能力，编写强类型的 `electron-helper.ts`，安全获取当前窗口句柄并调用 `focused.setAlwaysOnTop(isPinned, 'floating')`，在 Frontmatter 中同步写入 `pinned: true/false`。

### 2. 彻底隐藏独立窗口顶部的多余标签栏 (Tab Header Container)
在 `styles.css` 中将 `.workspace-tab-header-container`、`.workspace-tab-header`、`.view-header`、`.titlebar` 的高度全部归零并强制 `display: none !important;`；同时在 `StickyWindowManager` 中挂载 `MutationObserver` 实时监控窗口 DOM 树，杜绝异步刷新死灰复燃。

### 3. 多选内容批量转换与精准光标位移算法
在 `DesktopStickyToolbar` 中实现 `toggleBlockPrefix(editor, mode)`：
1. **待办 Checklist**：全为待办则批量取消；包含普通行则批量加上 `- [ ] `；
2. **编号列表 Number**：选中多行时自动按顺序递增编号（`1. `、`2. `、`3. ` ...）；
3. **单行光标位移**：单行空行或行首触发时，精准计算前缀长度（待办 +6，列表 +2，编号 +3），自动将光标重置到前缀空格后，确保用户无缝打字。

### 4. 标题、YAML 元数据与工具栏居中/隐藏控制
- **显隐控制**：便笺容器默认带有 `.hide-sticky-title` 与 `.hide-sticky-yaml` 类，工具栏提供一键切换按钮；
- **绝对居中**：通过 `position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);` 使核心工具条绝对水平居中；
- **鼠标离开自动淡出**：光标离开便笺窗口时工具栏平滑淡出，移入便笺时浮现。

### 5. 屏幕安全边界越界保护 (Screen Bounds Clamping)
在恢复便笺记忆坐标时，检测 `window.screen.availWidth` 与 `window.screen.availHeight`，若记忆坐标因显示器断开超出可视范围，自动拉回主屏幕中央安全区域。

### 6. 便笺管理器 (Sticky Notes Hub)
独立模态面板，毫秒级遍历指定便笺目录并提取摘要与配色，支持即时过滤搜索，点击卡片直接在桌面独立弹出对应便笺。

### 7. 原生中英文双语国际化 (i18n)
编写 `src/i18n.ts` 模块，通过 Obsidian 官方的 `getLanguage()` 识别宿主环境语言，严格区分中英文字典，所有命令、右键菜单、设置标签、工具栏 Tooltip、皮肤颜色名称及通知提示均通过 `t(key)` 动态派发，彻底消除中英文混杂。

---

## 四、 质量保证与代码规范

- **严格类型检查**：完全消除全局任意 `any` 标注与未解构作用域（`this: void`），满足严格 TypeScript 配置；
- **ESLint 规范扫描**：全面适配 `eslint-plugin-obsidianmd`，达到 **0 errors** 规范标准；
- **打包精简与性能**：生产产物 `main.js` 仅 **25KB**，零第三方臃肿打包，内存开销极小。
