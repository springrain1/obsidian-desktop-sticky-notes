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
	getTargetBrowserWindow,
} from './electron-helper';
import { t } from './i18n';

export class StickyWindowManager {
	private app: App;
	private plugin: DesktopStickyNotesPlugin;

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
		const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
		const prefix = t('filePrefix');
		const filePath = normalizePath(`${folderPath}/${prefix}_${dateStr}.md`);

		const defaultMode = this.plugin.settings.defaultPinned ? 'pin' : 'float';
		const initialContent = [
			'---',
			'is_sticky: true',
			`color: "${this.plugin.settings.defaultColor}"`,
			`pinned: ${this.plugin.settings.defaultPinned}`,
			`mode: "${defaultMode}"`,
			`created_at: "${now.toISOString()}"`,
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
	 * 屏幕安全区域尺寸计算
	 */
	private clampBoundsToScreen(bounds: { width?: number; height?: number }): { width: number; height: number } {
		const availW = window.screen.availWidth || 1920;
		const availH = window.screen.availHeight || 1080;

		let width = bounds.width || this.plugin.settings.defaultWidth;
		let height = bounds.height || this.plugin.settings.defaultHeight;

		width = Math.max(220, Math.min(width, availW));
		height = Math.max(200, Math.min(height, availH));

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
		const safeSize = this.clampBoundsToScreen(fm.bounds || {});

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

		// 注入桌面便笺窗口专属样式标记（顶栏标签由 styles.css 的 display:none !important 声明式隐藏）
		targetWin.document.body.classList.add('is-evernote-sticky-window');
		view.containerEl.classList.add('evernote-sticky-card');

		// 清理旧工具栏，防止重复注入
		const oldToolbar = view.containerEl.querySelector('.evernote-sticky-toolbar');
		oldToolbar?.remove();

		// 二次定位恢复历史物理坐标 (解决 Obsidian openPopoutLeaf 不支持坐标参数的局限，兼顾单屏与多显示器副屏，防止拔屏失联)
		const cache = this.app.metadataCache.getFileCache(file);
		const fm = (cache?.frontmatter as StickyNoteMeta) || {};
		if (fm.bounds && typeof fm.bounds.x === 'number' && typeof fm.bounds.y === 'number') {
			if (Number.isFinite(fm.bounds.x) && Number.isFinite(fm.bounds.y)) {
				let safeX = fm.bounds.x;
				const safeY = Math.max(-20, fm.bounds.y);

				// 拔出副屏容错：若当前屏幕处于标准单屏模式且历史 X 坐标已远超当前屏可视边界，自动拉回主屏视野
				const screen = targetWin.screen;
				const availLeft = (screen as unknown as Record<string, number | undefined>).availLeft ?? 0;
				const availW = screen.availWidth || 1920;
				if (availLeft === 0 && safeX > availW) {
					safeX = Math.max(20, availW - (fm.bounds.width || 320) - 20);
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
		let boundsTimer: number | null = null;

		const onBoundsChange = () => {
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
			} catch {
				// 跨进程安全容错
			}
		}

		// 当 leaf 销毁或关闭时彻底取消监听
		targetWin.addEventListener(
			'pagehide',
			() => {
				abortController.abort();
				if (bw && typeof (bw as unknown as Record<string, unknown>).removeListener === 'function') {
					try {
						(bw as unknown as { removeListener: (event: string, listener: () => void) => void }).removeListener('move', onBwMove);
					} catch {
						// 清理容错
					}
				}
				void this.persistWindowBounds(file, targetWin);
			},
			{ once: true },
		);
	}

	/**
	 * 自动扫描并重新渲染所有处于独立浮窗中的便笺 (解决关闭主窗口或启动恢复工作区后便笺退化为普通窗口的缺陷)
	 */
	public rehydrateExistingStickyNotes() {
		const rootSplit = this.app.workspace.rootSplit;
		const leaves = this.app.workspace.getLeavesOfType('markdown');
		for (const leaf of leaves) {
			if (leaf.getContainer() !== rootSplit) {
				const view = leaf.view;
				if (view instanceof MarkdownView && view.file) {
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
	}

	/**
	 * 批量同步更新所有已打开桌面便笺窗口的任务栏可见性 (隐藏或恢复)
	 */
	public updateAllNotesTaskbarVisibility(skip: boolean) {
		const leaves = this.app.workspace.getLeavesOfType('markdown');
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof MarkdownView && leaf.getContainer() !== this.app.workspace.rootSplit) {
				const targetWin = view.containerEl.ownerDocument.defaultView;
				if (targetWin) {
					setWindowSkipTaskbar(targetWin, skip);
				}
			}
		}
	}

	/**
	 * 批量更新所有便笺窗口的中间格式工具栏显示状态 (极简模式实时生效)
	 */
	public updateAllNotesFormattingToolbar(hide: boolean) {
		const leaves = this.app.workspace.getLeavesOfType('markdown');
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof MarkdownView && leaf.getContainer() !== this.app.workspace.rootSplit) {
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
			const prevBounds = currentFm.bounds;

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
				const prev = (fm.bounds as Record<string, unknown>) || {};
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
}
