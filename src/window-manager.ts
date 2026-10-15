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

export class StickyWindowManager {
	private app: App;
	private plugin: DesktopStickyNotesPlugin;

	constructor(plugin: DesktopStickyNotesPlugin) {
		this.plugin = plugin;
		this.app = plugin.app;
	}

	/**
	 * 打开便签列表管理器 (Sticky Notes Hub)
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

		// 时间戳命名
		const now = new Date();
		const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
		const filePath = normalizePath(`${folderPath}/便签_${dateStr}.md`);

		const initialContent = [
			'---',
			'is_sticky: true',
			`color: "${this.plugin.settings.defaultColor}"`,
			`pinned: ${this.plugin.settings.defaultPinned}`,
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
	 * 屏幕安全区域坐标计算 (防止多显示器断开后漂出屏幕)
	 */
	private clampBoundsToScreen(bounds: { x?: number; y?: number; width?: number; height?: number }): { width: number; height: number } {
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

		// 5. 挂载印象笔记便签工具栏与拟物皮肤
		this.mountStickyFeatures(leaf, file);
	}

	/**
	 * 挂载便签工具栏与皮肤，接管桌面独立窗口行为
	 */
	private mountStickyFeatures(leaf: WorkspaceLeaf, file: TFile) {
		// 延时等待 Popout 窗口 DOM 就绪
		window.setTimeout(() => {
			const view = leaf.view;
			if (!(view instanceof MarkdownView)) return;

			const targetWin = view.containerEl.ownerDocument.defaultView;
			if (!targetWin) return;

			// 给独立桌面窗口的 body 注入专属便签标记
			targetWin.document.body.classList.add('is-evernote-sticky-window');

			// 彻底隐藏顶部标签页头部 (Tab Header Container) 与标题栏
			const hideTopTabHeaders = () => {
				const headers = targetWin.document.querySelectorAll(
					'.workspace-tab-header-container, .workspace-tab-header-container-inner, .workspace-tab-header, .titlebar, .view-header',
				);
				for (const h of Array.from(headers)) {
					const el = h as HTMLElement;
					el.addClass('is-hidden');
				}
			};

			hideTopTabHeaders();

			// 监听 DOM 树变动，防止 Obsidian 后续二次挂载标签栏
			const observer = new MutationObserver(() => {
				hideTopTabHeaders();
			});
			observer.observe(targetWin.document.body, {
				childList: true,
				subtree: true,
			});

			// 给视图容器注入便签卡片类
			view.containerEl.classList.add('evernote-sticky-card');

			// 如果已存在便签工具栏，先清理避免重复注入
			const oldToolbar = view.containerEl.querySelector('.evernote-sticky-toolbar');
			if (oldToolbar) {
				oldToolbar.remove();
			}

			// 创建并挂载顶部桌面便笺富文本工具栏
			new DesktopStickyToolbar(
				this.plugin,
				view,
				file,
				targetWin,
				view.containerEl,
			);

			// 自动聚焦编辑器第一行
			view.editor.focus();

			// 监听窗口尺寸变化，持久化记忆窗口几何位置
			let resizeTimer: number | null = null;
			targetWin.addEventListener('resize', () => {
				if (resizeTimer !== null) targetWin.clearTimeout(resizeTimer);
				resizeTimer = targetWin.setTimeout(() => {
					void this.persistWindowBounds(file, targetWin);
				}, 800);
			});
		}, 80);
	}

	/**
	 * 持久化记录便签窗口宽高与坐标
	 */
	private async persistWindowBounds(file: TFile, win: Window) {
		try {
			await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
				fm.bounds = {
					width: win.innerWidth,
					height: win.innerHeight,
					x: win.screenX,
					y: win.screenY,
				};
			});
		} catch {
			// 文件繁忙时静默忽略
		}
	}
}
