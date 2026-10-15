import {
	MarkdownView,
	TFile,
	setIcon,
	Notice,
	Editor,
} from 'obsidian';
import { STICKY_COLORS, StickyNoteMeta, WindowMode, getStickyColorName, StickyColorInfo } from './types';
import { setWindowTopmost, setWindowSkipTaskbar } from './electron-helper';
import { ConfirmModal } from './confirm-modal';
import { t } from './i18n';
import type DesktopStickyNotesPlugin from './main';

export class DesktopStickyToolbar {
	private plugin: DesktopStickyNotesPlugin;
	private view: MarkdownView;
	private file: TFile;
	private targetWin: Window;
	private containerEl: HTMLElement;

	public toolbarEl!: HTMLElement;
	private pinBtnEl!: HTMLElement;
	private titleBtnEl!: HTMLElement;
	private yamlBtnEl!: HTMLElement;
	private skinSelectorPopover: HTMLElement | null = null;
	private currentMode: WindowMode = 'float';
	private showTitle = false;
	private showYaml = false;
	private currentColor = 'yellow';

	constructor(
		plugin: DesktopStickyNotesPlugin,
		view: MarkdownView,
		file: TFile,
		targetWin: Window,
		containerEl: HTMLElement,
	) {
		this.plugin = plugin;
		this.view = view;
		this.file = file;
		this.targetWin = targetWin;
		this.containerEl = containerEl;

		// 默认隐藏内联标题与 YAML 属性
		this.containerEl.addClass('hide-sticky-title');
		this.containerEl.addClass('hide-sticky-yaml');

		// 根据配置是否开启鼠标离开时自动隐藏工具栏
		if (this.plugin.settings.autoHideToolbar) {
			this.containerEl.addClass('auto-hide-toolbar');
		}

		this.initMeta();
		this.buildToolbar();
		this.applyColorTheme(this.currentColor);
		this.applyWindowMode(this.currentMode, false);
	}

	/**
	 * 从文件元数据初始化窗口模式与配色
	 */
	private initMeta() {
		const cache = this.plugin.app.metadataCache.getFileCache(this.file);
		const fm = (cache?.frontmatter as StickyNoteMeta) || {};
		this.currentColor = fm.color || this.plugin.settings.defaultColor;

		if (fm.mode) {
			this.currentMode = fm.mode;
		} else if (fm.pinned !== undefined) {
			this.currentMode = fm.pinned ? 'pin' : 'float';
		} else {
			this.currentMode = this.plugin.settings.defaultPinned ? 'pin' : 'float';
		}
	}

	/**
	 * 构建顶部悬浮工具栏
	 */
	private buildToolbar() {
		this.toolbarEl = this.containerEl.createDiv({
			cls: 'evernote-sticky-toolbar',
		});

		// 左侧组：新建便笺、置顶、换肤
		const leftGroup = this.toolbarEl.createDiv({ cls: 'sticky-toolbar-group left' });

		// 1. 新建便笺
		const newBtn = leftGroup.createDiv({
			cls: 'sticky-action-btn sticky-action-new',
			title: t('tbNew'),
		});
		setIcon(newBtn, 'plus');
		newBtn.onclick = () => {
			void this.plugin.windowManager.createNewStickyNote();
		};

		// 2. 窗口形态三态流转 (Float -> Pin -> Dock -> Float)
		this.pinBtnEl = leftGroup.createDiv({
			cls: 'sticky-action-btn sticky-action-pin',
		});
		this.updatePinButtonUI();
		this.pinBtnEl.onclick = () => {
			void this.cycleWindowMode();
		};

		// 3. 换肤调色盘
		const skinBtn = leftGroup.createDiv({
			cls: 'sticky-action-btn sticky-action-skin',
			title: t('tbSkin'),
		});
		setIcon(skinBtn, 'palette');
		skinBtn.onclick = (e) => {
			e.stopPropagation();
			this.toggleSkinSelector(skinBtn);
		};

		// 中间富文本格式组：待办、无序列表、编号列表、删除线、图片、标题切换、YAML切换
		const centerGroup = this.toolbarEl.createDiv({ cls: 'sticky-toolbar-group center' });

		// 4. 待办勾选框
		const todoBtn = centerGroup.createDiv({
			cls: 'sticky-action-btn sticky-action-todo',
			title: t('tbTodo'),
		});
		setIcon(todoBtn, 'check-square');
		todoBtn.onclick = () => {
			this.executeEditorAction((editor) => this.toggleBlockPrefix(editor, 'checklist'));
		};

		// 5. 无序列表
		const bulletBtn = centerGroup.createDiv({
			cls: 'sticky-action-btn sticky-action-bullet',
			title: t('tbBullet'),
		});
		setIcon(bulletBtn, 'list');
		bulletBtn.onclick = () => {
			this.executeEditorAction((editor) => this.toggleBlockPrefix(editor, 'bullet'));
		};

		// 6. 编号列表
		const numberBtn = centerGroup.createDiv({
			cls: 'sticky-action-btn sticky-action-number',
			title: t('tbNumber'),
		});
		setIcon(numberBtn, 'list-ordered');
		numberBtn.onclick = () => {
			this.executeEditorAction((editor) => this.toggleBlockPrefix(editor, 'number'));
		};

		// 7. 删除线
		const strikeBtn = centerGroup.createDiv({
			cls: 'sticky-action-btn sticky-action-strikethrough',
			title: t('tbStrike'),
		});
		setIcon(strikeBtn, 'strikethrough');
		strikeBtn.onclick = () => {
			this.executeEditorAction((editor) => this.toggleStrikethrough(editor));
		};

		// 8. 插入图片（默认点击直接弹出资源管理器）
		const imgBtn = centerGroup.createDiv({
			cls: 'sticky-action-btn sticky-action-image',
			title: t('tbImage'),
		});
		setIcon(imgBtn, 'image');
		imgBtn.onclick = () => {
			this.openImageFileDialog();
		};

		// 9. 切换显示/隐藏笔记标题
		this.titleBtnEl = centerGroup.createDiv({
			cls: 'sticky-action-btn sticky-action-heading',
			title: t('tbTitle'),
		});
		setIcon(this.titleBtnEl, 'heading');
		this.titleBtnEl.onclick = () => {
			this.toggleTitle();
		};

		// 10. 切换显示/隐藏元数据 (YAML)
		this.yamlBtnEl = centerGroup.createDiv({
			cls: 'sticky-action-btn sticky-action-yaml',
			title: t('tbYaml'),
		});
		setIcon(this.yamlBtnEl, 'code');
		this.yamlBtnEl.onclick = () => {
			this.toggleYaml();
		};

		// 右侧操作组：恢复为主窗口、删除便笺、关闭便笺
		const rightGroup = this.toolbarEl.createDiv({ cls: 'sticky-toolbar-group right' });

		// 11. 恢复为 Obsidian 主窗口普通笔记视窗 (收回收纳至主库)
		const restoreBtn = rightGroup.createDiv({
			cls: 'sticky-action-btn sticky-action-restore',
			title: t('tbRestoreToMain'),
		});
		setIcon(restoreBtn, 'arrow-down-left');
		restoreBtn.onclick = () => {
			void this.restoreToMainWindow();
		};

		// 12. 删除便笺（移入废纸篓，带确认对话框防误触）
		const delBtn = rightGroup.createDiv({
			cls: 'sticky-action-btn sticky-action-delete',
			title: t('tbDelete'),
		});
		setIcon(delBtn, 'trash-2');
		delBtn.onclick = () => {
			new ConfirmModal(this.plugin.app, t('hubConfirmDelete'), () => {
				void (async () => {
					this.destroy();
					this.view.leaf.detach();
					await this.plugin.app.fileManager.trashFile(this.file);
					new Notice(t('noticeDeleted'));
				})();
			}).open();
		};

		// 13. 关闭便笺
		const closeBtn = rightGroup.createDiv({
			cls: 'sticky-action-btn sticky-action-close',
			title: t('tbClose'),
		});
		setIcon(closeBtn, 'x');
		closeBtn.onclick = () => {
			this.destroy();
			this.view.leaf.detach();
		};

		// 确保工具栏置顶于内容上方
		this.containerEl.prepend(this.toolbarEl);
	}

	/**
	 * 安全获取并操作当前编辑器
	 */
	private executeEditorAction(action: (editor: Editor) => void) {
		const editor = this.view.editor;
		action(editor);
		editor.focus();
	}

	/**
	 * 切换待办清单 / 无序列表 / 有序列表（完美支持单行光标或多行选中批量处理）
	 */
	private toggleBlockPrefix(
		editor: Editor,
		mode: 'checklist' | 'bullet' | 'number',
	) {
		const from = editor.getCursor('from');
		const to = editor.getCursor('to');
		const startLine = from.line;
		const endLine = to.line;
		const isSingleCursor = startLine === endLine && from.ch === to.ch;

		const lines: string[] = [];
		for (let l = startLine; l <= endLine; l++) {
			lines.push(editor.getLine(l));
		}

		if (mode === 'checklist') {
			const allAreChecklist = lines.every((l) => /^\s*[-*]\s+\[[ xX]\]\s*/.test(l));

			for (let i = 0; i < lines.length; i++) {
				const lineNum = startLine + i;
				const lineText = lines[i] ?? '';
				if (allAreChecklist) {
					const newLine = lineText.replace(/^\s*[-*]\s+\[[ xX]\]\s*/, '');
					editor.setLine(lineNum, newLine);
				} else {
					let newLine = lineText;
					if (/^\s*[-*]\s+\[[ xX]\]\s*/.test(lineText)) {
						// 保持
					} else if (/^\s*[-*]\s+/.test(lineText)) {
						newLine = lineText.replace(/^\s*[-*]\s+/, '- [ ] ');
					} else if (/^\s*\d+\.\s+/.test(lineText)) {
						newLine = lineText.replace(/^\s*\d+\.\s+/, '- [ ] ');
					} else {
						newLine = `- [ ] ${lineText}`;
					}
					editor.setLine(lineNum, newLine);
				}
			}

			if (isSingleCursor) {
				if (allAreChecklist) {
					editor.setCursor({ line: startLine, ch: Math.max(0, from.ch - 6) });
				} else {
					const newCh = from.ch === 0 ? 6 : from.ch + 6;
					editor.setCursor({ line: startLine, ch: newCh });
				}
			}
		} else if (mode === 'bullet') {
			const allAreBullet = lines.every((l) => /^\s*[-*]\s+(?!\[[ xX]\])/.test(l));

			for (let i = 0; i < lines.length; i++) {
				const lineNum = startLine + i;
				const lineText = lines[i] ?? '';
				if (allAreBullet) {
					const newLine = lineText.replace(/^\s*[-*]\s+/, '');
					editor.setLine(lineNum, newLine);
				} else {
					let newLine = lineText;
					if (/^\s*[-*]\s+\[[ xX]\]\s*/.test(lineText)) {
						newLine = lineText.replace(/^\s*[-*]\s+\[[ xX]\]\s*/, '- ');
					} else if (/^\s*\d+\.\s+/.test(lineText)) {
						newLine = lineText.replace(/^\s*\d+\.\s+/, '- ');
					} else if (/^\s*[-*]\s+/.test(lineText)) {
						// 保持
					} else {
						newLine = `- ${lineText}`;
					}
					editor.setLine(lineNum, newLine);
				}
			}

			if (isSingleCursor) {
				if (allAreBullet) {
					editor.setCursor({ line: startLine, ch: Math.max(0, from.ch - 2) });
				} else {
					const newCh = from.ch === 0 ? 2 : from.ch + 2;
					editor.setCursor({ line: startLine, ch: newCh });
				}
			}
		} else if (mode === 'number') {
			const allAreNumber = lines.every((l) => /^\s*\d+\.\s+/.test(l));

			let numIdx = 1;
			for (let i = 0; i < lines.length; i++) {
				const lineNum = startLine + i;
				const lineText = lines[i] ?? '';
				if (allAreNumber) {
					const newLine = lineText.replace(/^\s*\d+\.\s+/, '');
					editor.setLine(lineNum, newLine);
				} else {
					let newLine = lineText;
					if (/^\s*[-*]\s+(\[[ xX]\]\s*)?/.test(lineText)) {
						newLine = lineText.replace(/^\s*[-*]\s+(\[[ xX]\]\s*)?/, `${numIdx}. `);
					} else if (/^\s*\d+\.\s+/.test(lineText)) {
						newLine = lineText.replace(/^\s*\d+\.\s+/, `${numIdx}. `);
					} else {
						newLine = `${numIdx}. ${lineText}`;
					}
					editor.setLine(lineNum, newLine);
					numIdx++;
				}
			}

			if (isSingleCursor) {
				if (allAreNumber) {
					editor.setCursor({ line: startLine, ch: Math.max(0, from.ch - 3) });
				} else {
					const newCh = from.ch === 0 ? 3 : from.ch + 3;
					editor.setCursor({ line: startLine, ch: newCh });
				}
			}
		}
	}

	/**
	 * 切换删除线 (~~内容~~)
	 */
	private toggleStrikethrough(editor: Editor) {
		const selected = editor.getSelection();
		if (selected) {
			if (selected.startsWith('~~') && selected.endsWith('~~') && selected.length >= 4) {
				const unwrapped = selected.slice(2, -2);
				editor.replaceSelection(unwrapped);
			} else {
				editor.replaceSelection(`~~${selected}~~`);
			}
		} else {
			const cursor = editor.getCursor();
			editor.replaceRange('~~~~', cursor);
			editor.setCursor({ line: cursor.line, ch: cursor.ch + 2 });
		}
	}

	/**
	 * 循环切换窗口形态 (三态流转或经典二态)
	 */
	private async cycleWindowMode() {
		const isThreeState = this.plugin.settings.pinCycleMode === 'three-state';
		let nextMode: WindowMode = 'float';

		if (isThreeState) {
			const nextModeMap: Record<WindowMode, WindowMode> = {
				float: 'pin',
				pin: 'dock',
				dock: 'float',
			};
			nextMode = nextModeMap[this.currentMode];
		} else {
			// 经典二态：仅在 float 与 pin 之间来回切换
			nextMode = this.currentMode === 'pin' ? 'float' : 'pin';
		}

		this.applyWindowMode(nextMode, true);
		await this.persistFrontmatter({
			mode: nextMode,
			pinned: nextMode === 'pin',
		});
	}

	/**
	 * 应用窗口模式样式、层级与图标
	 */
	public applyWindowMode(mode: WindowMode, showNotice = false) {
		this.currentMode = mode;
		const targetWin = this.targetWin;

		switch (mode) {
			case 'float':
				setWindowTopmost(targetWin, false);
				setWindowSkipTaskbar(targetWin, this.plugin.settings.hideFromTaskbar);
				this.containerEl.removeClass('is-docked');
				if (showNotice) new Notice(t('noticeFloat'), 1500);
				break;

			case 'pin':
				setWindowTopmost(targetWin, true);
				setWindowSkipTaskbar(targetWin, this.plugin.settings.hideFromTaskbar);
				this.containerEl.removeClass('is-docked');
				if (showNotice) new Notice(t('noticePinned'), 1500);
				break;

			case 'dock':
				setWindowTopmost(targetWin, false);
				setWindowSkipTaskbar(targetWin, true);
				this.containerEl.addClass('is-docked');
				if (showNotice) new Notice(t('noticeDocked'), 1500);
				break;
		}

		this.updatePinButtonUI();
	}

	/**
	 * 更新 Pin/Dock 按钮的外观、图标与 Tooltip
	 */
	private updatePinButtonUI() {
		if (!this.pinBtnEl) return;

		const isThreeState = this.plugin.settings.pinCycleMode === 'three-state';
		let tooltip = '';
		switch (this.currentMode) {
			case 'float':
				this.pinBtnEl.removeClass('is-active');
				setIcon(this.pinBtnEl, 'pin');
				tooltip = isThreeState ? t('modeFloatTooltip') : t('modeTwoFloatTooltip');
				break;
			case 'pin':
				this.pinBtnEl.addClass('is-active');
				setIcon(this.pinBtnEl, 'pin');
				tooltip = isThreeState ? t('modePinTooltip') : t('modeTwoPinTooltip');
				break;
			case 'dock':
				this.pinBtnEl.addClass('is-active');
				setIcon(this.pinBtnEl, 'anchor');
				tooltip = t('modeDockTooltip');
				break;
		}

		this.pinBtnEl.setAttribute('title', tooltip);
		this.pinBtnEl.setAttribute('aria-label', tooltip);
	}

	/**
	 * 恢复为 Obsidian 主窗口普通笔记视窗 (收回收纳至主库，安全倒置时序杜绝新 Tab 随 popout 蒸发)
	 */
	private async restoreToMainWindow() {
		const file = this.file;
		const app = this.plugin.app;

		// 1. 立即触发视图安全落盘
		await this.view.save();

		// 2. 提前获取主窗口引用
		const openerWin = (window.opener as Window | null) ?? null;
		const activeWin = (window as unknown as { activeWindow?: Window }).activeWindow ?? null;
		const mainWin = (app.workspace as { containerWin?: Window }).containerWin ?? openerWin ?? activeWin ?? window;

		// 3. 检查主窗口根工作区 (rootSplit) 是否已打开此笔记，避免重复开启多余 Tab
		const rootSplit = app.workspace.rootSplit;
		let targetLeaf = app.workspace.getLeavesOfType('markdown').find(
			(l) => l.view instanceof MarkdownView && l.view.file?.path === file.path && l.getContainer() === rootSplit,
		);

		if (!targetLeaf) {
			targetLeaf = app.workspace.getLeaf('tab');
			await targetLeaf.openFile(file, { state: { mode: 'source' } });
		}

		// 4. 先在主窗口激活目标 Leaf，确保 activeContainer 稳固锚定在主库
		app.workspace.setActiveLeaf(targetLeaf, { focus: true });

		// 5. 此时再安全清理工具栏并销毁当前独立便笺浮窗
		this.destroy();
		this.view.leaf.detach();

		// 6. 主窗口置前聚焦并提示通知
		if (mainWin && typeof mainWin.focus === 'function') {
			mainWin.focus();
		}
		new Notice(t('noticeRestoredToMain'));
	}

	/**
	 * 切换笔记标题的显示 / 隐藏
	 */
	private toggleTitle() {
		this.showTitle = !this.showTitle;
		if (this.showTitle) {
			this.containerEl.removeClass('hide-sticky-title');
			this.titleBtnEl.addClass('is-active');
			new Notice(t('noticeTitleShow'), 1000);
		} else {
			this.containerEl.addClass('hide-sticky-title');
			this.titleBtnEl.removeClass('is-active');
			new Notice(t('noticeTitleHide'), 1000);
		}
	}

	/**
	 * 切换元数据 (YAML / 属性面板) 的显示 / 隐藏
	 */
	private toggleYaml() {
		this.showYaml = !this.showYaml;
		if (this.showYaml) {
			this.containerEl.removeClass('hide-sticky-yaml');
			this.yamlBtnEl.addClass('is-active');
			new Notice(t('noticeYamlShow'), 1000);
		} else {
			this.containerEl.addClass('hide-sticky-yaml');
			this.yamlBtnEl.removeClass('is-active');
			new Notice(t('noticeYamlHide'), 1000);
		}
	}

	/**
	 * 捕获点击外部以关闭调色盘气泡
	 */
	private onDocPointerDown = (evt: PointerEvent) => {
		const target = evt.target as Node | null;
		if (this.skinSelectorPopover && target) {
			const skinBtn = this.toolbarEl.querySelector('.sticky-action-skin');
			if (!this.skinSelectorPopover.contains(target) && (!skinBtn || !skinBtn.contains(target))) {
				this.closeSkinSelector();
			}
		}
	};

	/**
	 * 切换调色盘气泡
	 */
	private toggleSkinSelector(targetEl: HTMLElement) {
		if (this.skinSelectorPopover) {
			this.closeSkinSelector();
			return;
		}

		this.skinSelectorPopover = targetEl.createDiv({
			cls: 'sticky-skin-popover',
		});

		const fallbackColor = STICKY_COLORS.yellow as StickyColorInfo;

		for (const key of Object.keys(STICKY_COLORS)) {
			const color = STICKY_COLORS[key] ?? fallbackColor;
			const dot = this.skinSelectorPopover.createDiv({
				cls: 'sticky-skin-dot',
				title: getStickyColorName(key),
			});
			dot.style.backgroundColor = color.bg;
			dot.style.borderColor = color.border;

			if (this.currentColor === key) {
				dot.classList.add('is-current');
			}

			dot.onclick = (e) => {
				e.stopPropagation();
				this.currentColor = key;
				this.applyColorTheme(key);
				this.closeSkinSelector();
				void this.persistFrontmatter({ color: key });
				this.view.editor.focus();
			};
		}

		// 监听全局指针按下事件（使用 capture 保证优先捕获）
		this.containerEl.addClass('has-active-popover');
		this.targetWin.document.addEventListener('pointerdown', this.onDocPointerDown, true);
	}

	private closeSkinSelector() {
		if (this.skinSelectorPopover) {
			this.targetWin.document.removeEventListener('pointerdown', this.onDocPointerDown, true);
			this.containerEl.removeClass('has-active-popover');
			this.skinSelectorPopover.remove();
			this.skinSelectorPopover = null;
		}
	}

	/**
	 * 应用便笺配色至当前容器
	 */
	public applyColorTheme(colorKey: string) {
		const fallbackColor = STICKY_COLORS.yellow as StickyColorInfo;
		const color = STICKY_COLORS[colorKey] ?? fallbackColor;
		this.containerEl.style.setProperty('--sticky-bg-color', color.bg);
		this.containerEl.style.setProperty('--sticky-border-color', color.border);
		this.containerEl.style.setProperty('--sticky-header-color', color.header);
		this.containerEl.style.setProperty('--sticky-text-color', color.text);
	}

	/**
	 * 点击图片按钮直接唤起资源管理器文件选择对话框
	 */
	private openImageFileDialog() {
		const input = this.targetWin.document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.addClass('sticky-hidden-file-input');

		input.onchange = async () => {
			const file = input.files?.[0];
			input.remove();
			if (!file) return;

			try {
				const arrayBuffer = await file.arrayBuffer();
				const filename = file.name || 'image.png';

				const attachmentPath = await this.plugin.app.fileManager.getAvailablePathForAttachment(
					filename,
					this.file.path,
				);

				const createdFile = await this.plugin.app.vault.createBinary(attachmentPath, arrayBuffer);
				const link = this.plugin.app.fileManager.generateMarkdownLink(createdFile, this.file.path);

				const editor = this.view.editor;
				const cursor = editor.getCursor();
				const isStandalone = !link.startsWith('!');
				const insertText = `${isStandalone ? '!' : ''}${link}\n`;

				editor.replaceRange(insertText, cursor);
				editor.setCursor({
					line: cursor.line + 1,
					ch: 0,
				});
				editor.focus();
				new Notice(t('noticeImgSuccess'));
			} catch (err) {
				console.error('[DesktopStickyNotes] Failed to insert image from file dialog:', err);
				new Notice(t('noticeImgFail'));
			}
		};

		this.targetWin.document.body.appendChild(input);
		input.click();
	}

	/**
	 * 将状态异步更新至笔记 Frontmatter
	 */
	private async persistFrontmatter(patch: Partial<StickyNoteMeta>) {
		try {
			await this.plugin.app.fileManager.processFrontMatter(this.file, (fm: Record<string, unknown>) => {
				fm.is_sticky = true;
				for (const [k, v] of Object.entries(patch)) {
					fm[k] = v;
				}
			});
		} catch {
			// 文件繁忙或正在编辑时忽略
		}
	}

	public destroy() {
		this.closeSkinSelector();
	}
}
