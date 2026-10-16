import {
	App,
	TFile,
	normalizePath,
	WorkspaceLeaf,
	MarkdownView,
} from 'obsidian';
import { StickyNoteMeta } from './types';
import type DesktopStickyNotesPlugin from './main';
import { DesktopStickyToolbar } from './toolbar';
import { StickyNotesHubModal } from './hub-modal';
import {
	setWindowSkipTaskbar,
	getCurrentWindowBounds,
	setWindowPosition,
	setWindowContentSize,
	getTargetBrowserWindow,
} from './electron-helper';
import { t } from './i18n';

export class StickyWindowManager {
	private app: App;
	private plugin: DesktopStickyNotesPlugin;
	private activeStickyControllers = new WeakMap<WorkspaceLeaf, AbortController>();
	private bwMoveCleanups = new WeakMap<WorkspaceLeaf, () => void>();

	constructor(plugin: DesktopStickyNotesPlugin) {
		this.plugin = plugin;
		this.app = plugin.app;
	}

	/**
	 * 打开便笺列表管理器 (Sticky Notes Hub)
	 */
	public openStickyNotesHub() {
		new StickyNotesHubModal(this.app, this.plugin).open();
	}

	/**
	 * 新建一个便签并以独立桌面窗口（原生实时预览）弹出
	 */
	public async createNewStickyNote(): Promise<TFile | null> {
		const folderPath = normalizePath(this.plugin.settings.notesFolder);

		// 确保便签存放文件夹存在
		if (!this.app.vault.getAbstractFileByPath(folderPath)) {
			await this.app.vault.createFolder(folderPath);
		}

		// 国际化命名前缀与时间戳命名
		const now = new Date();
		const pad = (n: number) => String(n).padStart(2, '0');
		const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
		const createdAtFormatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
		const prefix = t('filePrefix');
		const filePath = normalizePath(`${folderPath}/${prefix}_${dateStr}.md`);

		const defaultMode = this.plugin.settings.defaultPinned ? 'pin' : 'float';
		const initialContent = [
			'---',
			'is_sticky: true',
			`color: "${this.plugin.settings.defaultColor}"`,
			`pinned: ${this.plugin.settings.defaultPinned}`,
			`mode: "${defaultMode}"`,
			`created_at: "${createdAtFormatted}"`,
			'---',
			'',
			'',
		].join('\n');

		try {
			const file = await this.app.vault.create(filePath, initialContent);
			await this.openStickyNote(file);
			return file;
		} catch (e) {
			console.error('[DesktopStickyNotes] Create sticky note failed:', e);
			return null;
		}
	}

	/**
	 * 安全解析 Frontmatter 中的 bounds 属性 (兼顾对象结构与 JSON 字符串序列化)
	 */
	private parseBounds(raw: unknown): { x?: number; y?: number; width?: number; height?: number } | null {
		if (!raw) return null;
		let obj: unknown = raw;
		if (typeof raw === 'string') {
			try {
				obj = JSON.parse(raw) as unknown;
			} catch {
				return null;
			}
		}
		if (typeof obj === 'object' && obj !== null) {
			const b = obj as Record<string, unknown>;
			const toNum = (val: unknown): number | undefined => {
				if (typeof val === 'number' && Number.isFinite(val)) return val;
				if (typeof val === 'string') {
					const parsed = parseFloat(val);
					return Number.isFinite(parsed) ? parsed : undefined;
				}
				return undefined;
			};
			return {
				x: toNum(b.x),
				y: toNum(b.y),
				width: toNum(b.width),
				height: toNum(b.height),
			};
		}
		return null;
	}

	/**
	 * 屏幕安全区域尺寸计算
	 */
	private clampBoundsToScreen(bounds: { width?: number; height?: number }): { width: number; height: number } {
		const availW = window.screen.availWidth || 1920;
		const availH = window.screen.availHeight || 1080;

		let width = bounds.width || this.plugin.settings.defaultWidth;
		let height = bounds.height || this.plugin.settings.defaultHeight;

		width = Math.max(180, Math.min(width, availW));
		height = Math.max(140, Math.min(height, availH));

		return { width, height };
	}

	/**
	 * 将指定笔记以桌面便签独立小窗（原生 Live Preview）打开
	 */
	public async openStickyNote(file: TFile) {
		// 1. 检查当前是否已有浮动窗口打开该笔记
		const leaves = this.app.workspace.getLeavesOfType('markdown');
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof MarkdownView && view.file?.path === file.path) {
				const isPopout = leaf.getContainer() !== this.app.workspace.rootSplit;
				if (isPopout) {
					this.app.workspace.setActiveLeaf(leaf, { focus: true });
					return;
				}
			}
		}

		// 2. 读取该文件前置参数并进行屏幕安全夹取 (Screen Clamping)
		const cache = this.app.metadataCache.getFileCache(file);
		const fm = (cache?.frontmatter as StickyNoteMeta) || {};
		const bounds = this.parseBounds(fm.bounds);
		const safeSize = this.clampBoundsToScreen(bounds || {});

		// 3. 打开独立 Popout 窗口
		const leaf = this.app.workspace.openPopoutLeaf({
			size: safeSize,
		});

		// 4. 以 Markdown 实时预览模式打开该文件
		await leaf.openFile(file, {
			state: { mode: 'source' },
		});

		// 5. 挂载桌面便笺工具栏与拟物皮肤
		this.mountStickyFeatures(leaf, file);
	}

	/**
	 * 挂载便笺工具栏与皮肤，接管桌面独立窗口行为
	 */
	private mountStickyFeatures(leaf: WorkspaceLeaf, file: TFile) {
		const view = leaf.view;
		if (!(view instanceof MarkdownView)) return;

		const targetWin = view.containerEl.ownerDocument.defaultView;
		if (!targetWin) return;

		// 1. 若该 leaf 之前已挂载过，先彻底 abort 旧 controller 并移除 Electron 监听器 (保证绝对幂等，杜绝监听器翻倍)
		const prevController = this.activeStickyControllers.get(leaf);
		if (prevController) {
			prevController.abort();
			this.activeStickyControllers.delete(leaf);
		}
		const prevBwCleanup = this.bwMoveCleanups.get(leaf);
		if (prevBwCleanup) {
			prevBwCleanup();
			this.bwMoveCleanups.delete(leaf);
		}

		// 注入桌面便笺窗口专属样式标记与间距变量
		targetWin.document.body.classList.add('is-evernote-sticky-window');

		// 关键 API 手段：从 DOM 根源直接拔除 is-readable-line-width 类名，彻底解开小窗口的右侧行宽锁死
		const editorEl = view.contentEl.querySelector('.markdown-source-view');
		editorEl?.classList.remove('is-readable-line-width');

		view.containerEl.classList.add('evernote-sticky-card');
		view.containerEl.style.setProperty('--sticky-pad-v', `${this.plugin.settings.paddingVertical}px`);
		view.containerEl.style.setProperty('--sticky-pad-h', `${this.plugin.settings.paddingHorizontal}px`);

		// 清理旧工具栏，防止重复注入
		const oldToolbar = view.containerEl.querySelector('.evernote-sticky-toolbar');
		oldToolbar?.remove();

		// 二次定位恢复历史物理坐标与精确内容尺寸 (突破 Obsidian openPopoutLeaf 尺寸与坐标未严格生效的局限)
		const cache = this.app.metadataCache.getFileCache(file);
		const fm = (cache?.frontmatter as StickyNoteMeta) || {};
		const bounds = this.parseBounds(fm.bounds);
		if (bounds) {
			// 1. 精确二次还原尺寸 (如用户在 YAML 中保存的 width: 319, height: 250)
			if (typeof bounds.width === 'number' && typeof bounds.height === 'number') {
				const safeSize = this.clampBoundsToScreen(bounds);
				setWindowContentSize(targetWin, safeSize.width, safeSize.height);
			}

			// 2. 精确二次还原物理位置
			if (typeof bounds.x === 'number' && typeof bounds.y === 'number') {
				let safeX = bounds.x;
				const safeY = Math.max(-20, bounds.y);

				// 拔出副屏容错：若当前屏幕处于标准单屏模式且历史 X 坐标已远超当前屏可视边界，自动拉回主屏视野
				const screen = targetWin.screen;
				const availLeft = (screen as unknown as Record<string, number | undefined>).availLeft ?? 0;
				const availW = screen.availWidth || 1920;
				if (availLeft === 0 && safeX > availW) {
					safeX = Math.max(20, availW - (bounds.width || 320) - 20);
				}

				setWindowPosition(targetWin, safeX, safeY);
			}
		}

		// 同步当前配置的任务栏可见性状态 (开启隐藏或恢复显示)
		setWindowSkipTaskbar(targetWin, this.plugin.settings.hideFromTaskbar);

		// 创建并挂载顶部桌面便笺富文本工具栏
		new DesktopStickyToolbar(
			this.plugin,
			view,
			file,
			targetWin,
			view.containerEl,
		);

		// 自动聚焦编辑器
		view.editor.focus();

		// 使用 AbortController 严格管理窗口 resize 与 move 监听器生命周期，杜绝内存泄漏
		const abortController = new AbortController();
		this.activeStickyControllers.set(leaf, abortController);
		let boundsTimer: number | null = null;

		// 抑制还原期抖动 (800ms 内不落盘，防止刚刚 setContentSize 激发的系统微调被误回写覆盖 frontmatter)
		let isRestoring = true;
		targetWin.setTimeout(() => {
			isRestoring = false;
		}, 800);

		const onBoundsChange = () => {
			if (isRestoring) return;
			if (boundsTimer !== null) targetWin.clearTimeout(boundsTimer);
			boundsTimer = targetWin.setTimeout(() => {
				void this.persistWindowBounds(file, targetWin);
			}, 500);
		};

		targetWin.addEventListener('resize', onBoundsChange, { signal: abortController.signal });
		targetWin.addEventListener('blur', onBoundsChange, { signal: abortController.signal });

		// 原生 Electron 窗口拖拽 move 事件监听 (实现真正的拖拽松手即持久化，消除 R1 隐患)
		const bw = getTargetBrowserWindow(targetWin);
		const onBwMove = () => onBoundsChange();
		if (bw && typeof (bw as unknown as Record<string, unknown>).on === 'function') {
			try {
				(bw as unknown as { on: (event: string, listener: () => void) => void }).on('move', onBwMove);
				this.bwMoveCleanups.set(leaf, () => {
					try {
						(bw as unknown as { removeListener: (event: string, listener: () => void) => void }).removeListener('move', onBwMove);
					} catch {
						// 容错
					}
				});
			} catch {
				// 跨进程安全容错
			}
		}

		// 当 leaf 销毁或关闭时彻底取消监听并安全注销
		targetWin.addEventListener(
			'pagehide',
			() => {
				abortController.abort();
				this.activeStickyControllers.delete(leaf);
				const cleanup = this.bwMoveCleanups.get(leaf);
				if (cleanup) {
					cleanup();
					this.bwMoveCleanups.delete(leaf);
				}
				void this.persistWindowBounds(file, targetWin);
			},
			{ once: true },
		);
	}

	/**
	 * 获取所有当前处于独立浮窗中的便笺视图 (统一收敛浮窗过滤逻辑)
	 */
	private *stickyPopoutViews(): IterableIterator<{ leaf: WorkspaceLeaf; view: MarkdownView; targetWin: Window | null }> {
		const rootSplit = this.app.workspace.rootSplit;
		for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
			const view = leaf.view;
			if (view instanceof MarkdownView && leaf.getContainer() !== rootSplit) {
				const targetWin = view.containerEl.ownerDocument.defaultView;
				yield { leaf, view, targetWin };
			}
		}
	}

	/**
	 * 自动扫描并重新渲染所有处于独立浮窗中的便笺 (解决关闭主窗口或启动恢复工作区后便笺退化为普通窗口的缺陷)
	 */
	public rehydrateExistingStickyNotes() {
		for (const { leaf, view } of this.stickyPopoutViews()) {
			if (view.file) {
				const cache = this.app.metadataCache.getFileCache(view.file);
				const fm = cache?.frontmatter as StickyNoteMeta | undefined;
				if (fm && (fm.is_sticky || fm.mode)) {
					const hasToolbar = view.containerEl.querySelector('.evernote-sticky-toolbar');
					if (!hasToolbar) {
						this.mountStickyFeatures(leaf, view.file);
					}
				}
			}
		}
	}

	/**
	 * 批量同步更新所有已打开桌面便笺窗口的任务栏可见性 (隐藏或恢复)
	 */
	public updateAllNotesTaskbarVisibility(skip: boolean) {
		for (const { targetWin } of this.stickyPopoutViews()) {
			if (targetWin) {
				setWindowSkipTaskbar(targetWin, skip);
			}
		}
	}

	/**
	 * 批量更新所有便笺窗口的中间格式工具栏显示状态 (极简模式实时生效)
	 */
	public updateAllNotesFormattingToolbar(hide: boolean) {
		for (const { view } of this.stickyPopoutViews()) {
			const toolbarEl = view.containerEl.querySelector('.evernote-sticky-toolbar');
			if (toolbarEl) {
				if (hide) {
					toolbarEl.classList.add('hide-formatting');
				} else {
					toolbarEl.classList.remove('hide-formatting');
				}
			}
		}
	}

	/**
	 * 批量同步更新所有已打开桌面便笺窗口的内容边距 (上下/左右间距实时生效)
	 */
	public updateAllNotesPadding(v: number, h: number) {
		for (const { view, targetWin } of this.stickyPopoutViews()) {
			const editorEl = view.contentEl.querySelector('.markdown-source-view');
			editorEl?.classList.remove('is-readable-line-width');
			view.containerEl.style.setProperty('--sticky-pad-v', `${v}px`);
			view.containerEl.style.setProperty('--sticky-pad-h', `${h}px`);

			// 关键 API 手段：触发编辑器尺寸重新测量，清空旧的断行缓存，使文本立即按照最新边距重新断行
			if (typeof (view as unknown as { onResize?: () => void }).onResize === 'function') {
				(view as unknown as { onResize: () => void }).onResize();
			}
			if (targetWin && typeof targetWin.dispatchEvent === 'function') {
				targetWin.dispatchEvent(new Event('resize'));
			}
		}
	}

	/**
	 * 全量持久化记录便笺窗口的真实物理几何坐标与内容尺寸 (带脏检查，无变更不写盘)
	 */
	private async persistWindowBounds(file: TFile, win: Window) {
		try {
			const b = getCurrentWindowBounds(win);

			// 脏检查：若坐标与尺寸无实质变化（微小抖动 < 2px），直接跳过写入，避免无谓修改 mtime 和触发同步 diff
			const cache = this.app.metadataCache.getFileCache(file);
			const currentFm = (cache?.frontmatter as StickyNoteMeta) || {};
			const prevBounds = this.parseBounds(currentFm.bounds);

			if (
				prevBounds &&
				typeof prevBounds.x === 'number' &&
				typeof prevBounds.y === 'number' &&
				typeof prevBounds.width === 'number' &&
				typeof prevBounds.height === 'number'
			) {
				const isUnchanged =
					Math.abs(prevBounds.x - b.x) < 2 &&
					Math.abs(prevBounds.y - b.y) < 2 &&
					Math.abs(prevBounds.width - b.width) < 2 &&
					Math.abs(prevBounds.height - b.height) < 2;

				if (isUnchanged) return;
			}

			await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
				const prev = this.parseBounds(fm.bounds) || {};
				fm.bounds = {
					...prev,
					x: b.x,
					y: b.y,
					width: b.width,
					height: b.height,
				};
			});
		} catch {
			// 文件繁忙时静默忽略
		}
	}

	/**
	 * 插件卸载时安全清理所有已挂载便签的控制器与监听器 (消除 onunload 监听器残留与越界写盘)
	 */
	public cleanupAllStickyFeatures() {
		for (const { leaf } of this.stickyPopoutViews()) {
			const controller = this.activeStickyControllers.get(leaf);
			if (controller) {
				controller.abort();
				this.activeStickyControllers.delete(leaf);
			}
			const cleanup = this.bwMoveCleanups.get(leaf);
			if (cleanup) {
				cleanup();
				this.bwMoveCleanups.delete(leaf);
			}
		}
	}
}
