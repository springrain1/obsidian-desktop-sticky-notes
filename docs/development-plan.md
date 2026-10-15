# 印象笔记桌面便签 (Evernote Sticky Note) 软件开发实施方案

---

## 一、 项目背景与逆向工程分析

### 1. 项目背景
印象笔记（Evernote for Windows 传统客户端 `Evernote.exe`）拥有广受用户喜爱的桌面便签（Sticky Note）功能：窗口小巧独立、常驻置顶、拟物纸质底色、所见即所得富文本交互。
而在 Obsidian 生态中，普通笔记通常受限于主界面的网格窗格（Splits），虽然官方提供了 `Popout Window` 弹窗能力，但缺乏原汁原味的便签交互外壳、全局置顶机制与快捷便签工具栏。
本项目旨在：**在 Obsidian 插件框架基础上，100% 像素级复刻原版 Evernote.exe 桌面便签交互与视觉，同时完全兼容 Obsidian 本地 Markdown 知识体系。**

### 2. 原版 `Evernote.exe` 逆向工程定性
通过对原生 `Evernote.exe` 与 `Evernote.zh-CN.dll` 的二进制反编译与 PE 资源符号拓扑分析（基于三刀流逆向工程分析法），提取到原版便签的核心架构规范：
- **核心视图类**：`AVCSingleStickyNoteView` / `CSingleStickyNoteView`（基于 ATL/WTL 独立无边框弹窗）
- **颜色选择器**：`AVCStickyNoteSkinSelector` / `VCStickyNoteSkinSelector`
- **原版动作按钮链**（精确提取自 PE 图像资源表）：
  - `stickynote_btn_new`（新建便签）
  - `stickynote_topmost_sel` / `unsel`（窗口置顶与取消置顶）
  - `stickynote_btn_skin`（皮肤换色调色盘）
  - `stickynote_btn_checkbox`（待办事项 / Checklist）
  - `stickynote_btn_list`（项目符号列表）
  - `stickynote_btn_number_list`（编号列表）
  - `stickynote_btn_strikethrough`（删除线）
  - `stickynote_btn_capture`（截图 / 图片插入）
  - `stickynote_btn_close`（关闭便签）

---

## 二、 架构设计与技术选型

### 1. 架构演进与方案选型
在开发过程中，针对“富文本与 Markdown 兼容”经历了两次深度方案论证：

- **方案 A（自制富文本 DOM 容器 + 双向转换适配器）**：
  在 `ItemView` 内部使用 HTML `contenteditable` 容器，保存时转换回 Markdown。
  *缺陷*：脱离了 Obsidian 核心的 CodeMirror 6 编辑器上下文，无法享受 Obsidian 社区丰富的语法高亮、Wiki 链接、拼写检查以及实时预览交互。
- **方案 B（推荐并最终落地：直接承载原生 `MarkdownView` / Live Preview）**：
  在桌面 Popout Leaf 中直接运行 Obsidian 原生 `MarkdownView`（开启 Live Preview 模式），并在其外层挂载印象笔记拟物便签外壳、悬浮工具栏和 6 色便签皮肤。
  *优势*：
  1. **100% 实时预览**：原生 CM6 即打即显，输入 Markdown 语法（如 `- [ ] `、`**`）瞬间原地呈现为富文本复选框或高亮文字；
  2. **生态完全同源**：插件仅 18KB，零重型第三方黑盒依赖；
  3. **富文本工具全面可用**：通过 Obsidian 标准 `Editor` API，工具栏按钮直接驱动编辑器选区与行前缀。

### 2. 系统整体架构拓扑图

```
┌─────────────────────────────────────────────────────────────┐
│             Obsidian 宿主 (Electron / Workspace)            │
├──────────────────────────────┬──────────────────────────────┤
│     独立桌面窗口生命周期       │       便签数据持久层 (Vault)   │
│   (StickyWindowManager)      │   - 对应 StickyNotes/*.md    │
│  - openPopoutLeaf 独立视窗   │   - YAML Frontmatter 配置状态│
│  - Electron setAlwaysOnTop   │     (color, pinned, bounds)  │
│  - 彻底屏蔽顶部 Tab 标签栏   │   - 库内图片附件统一管理     │
├──────────────────────────────┴──────────────────────────────┤
│             CodeMirror 6 (Live Preview) 原生编辑内核        │
│  - 所见即所得实时渲染 (Checklist, Bullet, Number, Bold)     │
│  - 纯 CSS 变量穿透便签纸底色与文字色彩                     │
├─────────────────────────────────────────────────────────────┤
│             悬浮工具栏组件 (EvernoteStickyToolbar)          │
│  - 快捷操作：[+] [置顶] [调色盘]                             │
│  - 富文本组：[待办] [无序列表] [有序列表] [删除线] [选图插入]│
│  - 视图控制：[标题显示/隐藏] [YAML显示/隐藏]                 │
│  - 窗口关闭：[×]                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、 核心技术难点攻坚与实现方案

### 1. 真正的操作系统级桌面独立小窗与置顶 (Always on Top)
- **技术实现**：
  调用 Obsidian 官方的 `app.workspace.openPopoutLeaf({ size })`，使便签作为独立的 Electron `BrowserWindow` 弹出。
  为了跨平台与安全调用 Electron 窗口置顶能力，编写强类型的 `electron-helper.ts`：
  ```typescript
  interface WindowWithElectron extends Window {
      require?(this: void, module: string): {
          remote?: ElectronRemote;
          BrowserWindow?: {
              getFocusedWindow(this: void): ElectronWindow | null;
          };
      };
  }
  ```
  通过 `setWindowTopmost(targetWindow, isPinned)` 安全获取当前窗口句柄，调用 `focused.setAlwaysOnTop(isPinned, 'floating')`，并在 Frontmatter 中同步写入 `pinned: true/false`。

### 2. 彻底隐藏独立窗口顶部的多余标签栏 (Tab Header Container)
- **问题**：Obsidian 在打开 Popout 窗口时，默认会在窗口最上方带有一排包含关闭按钮和白底的标签栏（`.workspace-tab-header-container`），严重破坏便签拟物纸质质感。
- **解决方案（CSS 强制覆盖 + MutationObserver 动态兜底）**：
  1. 在 `styles.css` 中将 `.workspace-tab-header-container`、`.workspace-tab-header`、`.view-header`、`.titlebar` 的高度全部归零并强制 `display: none !important;`；
  2. 在 `StickyWindowManager` 中挂载 `MutationObserver`，实时监控窗口 DOM 树，彻底阻断 Obsidian 异步刷新再次生成标签栏的可能。

### 3. 多选内容批量转换与精准光标位移算法
- **问题**：在富文本工具栏中，用户经常需要选中多行文本批量转换为待办清单或序号列表；若仅替换文字，光标容易停留在行首或错误位置。
- **解决方案**：
  在 `EvernoteStickyToolbar` 中实现 `toggleBlockPrefix(editor, mode)`：
  1. 通过 `editor.getCursor('from')` 与 `to` 获取整段行区间；
  2. **待办 Checklist**：若选中的行已全部是待办，则批量移除；若包含普通文本或列表，则批量转换为 `- [ ] `；
  3. **编号列表 Number**：选中多行时自动按行下标自增编号（`1. `、`2. `、`3. ` ...）；
  4. **单行光标位移**：若为单行空行或行首触发，精准计算前缀长度（如待办 +6，列表 +2，编号 +3），自动将光标重置到前缀空格后，确保用户直接输入无缝打字。

### 4. 标题与 YAML 元数据的按需显隐
- **方案**：
  便签卡片容器默认包含 `.hide-sticky-title` 与 `.hide-sticky-yaml` 两个类，借助 CSS 选择器：
  ```css
  .evernote-sticky-card.hide-sticky-title .inline-title { display: none !important; }
  .evernote-sticky-card.hide-sticky-yaml .metadata-container { display: none !important; }
  ```
  在工具栏分别提供「标题按钮」与「YAML 按钮」，点击即可动态 toggle 对应类名并使按钮呈现高亮激活态。

### 5. 本地图片选择与标准链接生成
- **方案**：遵循用户指定的官方 API 规范（`reference/obsidian-api-master`）：
  1. 点击工具栏图片按钮直接拉起系统 Windows 资源管理器选择图片；
  2. 调用 `app.fileManager.getAvailablePathForAttachment(filename, sourcePath)` 获取官方合规附件路径；
  3. 通过 `app.vault.createBinary(attachmentPath, arrayBuffer)` 写入 Vault；
  4. 通过 `app.fileManager.generateMarkdownLink(createdFile, sourcePath)` 生成标准引用并插入光标行，Live Preview 自动完成渲染。

### 6. 皮肤与窗口几何尺寸记忆 (Bounds Persistence)
- **配色系统**：内置 6 种经 Pantone 校色的便签底色，通过 CSS 变量 `--sticky-bg-color`、`--sticky-border-color`、`--sticky-header-color`、`--sticky-text-color` 直接穿透至 CodeMirror 编辑区与滚动条。
- **几何记忆**：监听 `targetWin` 的 `resize` 事件，经 800ms 防抖后调用 `processFrontMatter` 将当前窗口的 `width`、`height`、`x`、`y` 写入笔记 YAML。

### 7. 原生中英文双语国际化 (i18n)
- **方案**：
  编写 `src/i18n.ts` 模块，通过 Obsidian 官方的 `getLanguage()` 识别宿主环境语言；
  严格区分中英文字典，所有命令、右键菜单、设置标签、工具栏 Tooltip、皮肤颜色名称及通知提示均通过 `t(key)` 动态派发，彻底消除中英文混杂。

---

## 四、 质量保证与代码规范

- **严格类型检查**：完全消除全局任意 `any` 标注与未解构作用域（`this: void`），满足严格 TypeScript 配置；
- **ESLint 规范扫描**：全面适配 `eslint-plugin-obsidianmd`，达到 **0 errors** 规范标准；
- **打包精简与性能**：生产产物 `main.js` 仅 **18KB**，零第三方臃肿打包，内存开销极小。

---

## 五、 后续演进路线 (Roadmap)

1. [ ] **全局快捷键呼出**：通过底层 GlobalHotkey 监听在桌面任意场景按快捷键唤出新便签；
2. [ ] **便签磁吸（Snapping）**：便签靠近屏幕边缘或多个便签彼此靠近时实现拟物磁力吸附；
3. [ ] **便签折叠（Roll-up）**：双击工具栏将便签卷起只保留标题栏条目。
