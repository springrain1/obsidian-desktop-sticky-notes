import { Plugin, TFile } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	StickyPluginSettings,
} from './types';
import { DesktopStickySettingTab } from './settings';
import { StickyWindowManager } from './window-manager';
import { t } from './i18n';

export default class DesktopStickyNotesPlugin extends Plugin {
	settings!: StickyPluginSettings;
	windowManager!: StickyWindowManager;

	async onload() {
		await this.loadSettings();

		this.windowManager = new StickyWindowManager(this);

		// 1. 左侧 Ribbon 快捷图标：新建便笺
		this.addRibbonIcon('sticky-note', t('ribbonTitle'), () => {
			void this.windowManager.createNewStickyNote();
		});

		// 2. 左侧 Ribbon 快捷图标：打开便笺管理器 (Notes Hub)
		this.addRibbonIcon('layout-grid', t('ribbonHubTitle'), () => {
			this.windowManager.openStickyNotesHub();
		});

		// 3. 注册命令：新建桌面便笺
		this.addCommand({
			id: 'create-new-sticky-note',
			name: t('cmdNewSticky'),
			callback: () => {
				void this.windowManager.createNewStickyNote();
			},
		});

		// 4. 注册命令：打开桌面便笺管理器 (Notes Hub)
		this.addCommand({
			id: 'open-sticky-notes-hub',
			name: t('cmdOpenHub'),
			callback: () => {
				this.windowManager.openStickyNotesHub();
			},
		});

		// 5. 注册命令：将当前活动笔记以桌面便笺打开
		this.addCommand({
			id: 'open-current-as-sticky-note',
			name: t('cmdOpenCurrent'),
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile && activeFile.extension === 'md') {
					if (!checking) {
						void this.windowManager.openStickyNote(activeFile);
					}
					return true;
				}
				return false;
			},
		});

		// 6. 注册文件上下文菜单：右键笔记直接以桌面便笺打开
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (file instanceof TFile && file.extension === 'md') {
					menu.addItem((item) => {
						item.setTitle(t('menuOpenAsSticky'))
							.setIcon('sticky-note')
							.onClick(() => {
								void this.windowManager.openStickyNote(file);
							});
					});
				}
			}),
		);

		// 7. 注册设置面板
		this.addSettingTab(new DesktopStickySettingTab(this.app, this));
	}

	onunload() {
		// 移除便笺独立窗口的自定义样式标记
		for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
			const targetWin = leaf.view.containerEl.ownerDocument.defaultView;
			targetWin?.document.body.classList.remove('is-evernote-sticky-window');
			leaf.view.containerEl.classList.remove('evernote-sticky-card');
			const toolbar = leaf.view.containerEl.querySelector('.evernote-sticky-toolbar');
			toolbar?.remove();
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<StickyPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
