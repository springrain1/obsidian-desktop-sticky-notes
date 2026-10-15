import { App, Modal, TFile, setIcon, Notice } from 'obsidian';
import type DesktopStickyNotesPlugin from './main';
import { STICKY_COLORS, StickyNoteMeta } from './types';
import { t } from './i18n';

interface NoteItemData {
	file: TFile;
	title: string;
	snippet: string;
	color: string;
	pinned: boolean;
	updatedAt: number;
}

export class StickyNotesHubModal extends Modal {
	private plugin: DesktopStickyNotesPlugin;
	private searchInput!: HTMLInputElement;
	private cardsContainer!: HTMLElement;
	private allNotes: NoteItemData[] = [];
	private searchQuery = '';

	constructor(app: App, plugin: DesktopStickyNotesPlugin) {
		super(app);
		this.plugin = plugin;
	}

	async onOpen() {
		const { contentEl, modalEl } = this;
		modalEl.addClass('sticky-hub-modal');
		contentEl.empty();

		// 头部工具栏
		const headerEl = contentEl.createDiv({ cls: 'sticky-hub-header' });
		const titleEl = headerEl.createDiv({ cls: 'sticky-hub-title' });
		titleEl.setText(t('hubTitle'));

		const actionsEl = headerEl.createDiv({ cls: 'sticky-hub-actions' });
		const newBtn = actionsEl.createEl('button', {
			cls: 'sticky-hub-new-btn mod-cta',
			text: t('hubNewBtn'),
		});
		newBtn.onclick = async () => {
			this.close();
			await this.plugin.windowManager.createNewStickyNote();
		};

		// 搜索栏
		const searchWrapper = contentEl.createDiv({ cls: 'sticky-hub-search-wrapper' });
		this.searchInput = searchWrapper.createEl('input', {
			type: 'text',
			cls: 'sticky-hub-search-input',
			placeholder: t('hubSearchPlaceholder'),
		});
		this.searchInput.addEventListener('input', () => {
			this.searchQuery = this.searchInput.value.toLowerCase().trim();
			this.renderCards();
		});

		// 卡片容器
		this.cardsContainer = contentEl.createDiv({ cls: 'sticky-hub-cards-container' });

		// 加载数据
		await this.loadNotes();
		this.renderCards();
		this.searchInput.focus();
	}

	/**
	 * 从便签存放文件夹加载所有便签文件与元数据
	 */
	private async loadNotes() {
		const folderPath = this.plugin.settings.notesFolder;
		const folder = this.app.vault.getAbstractFileByPath(folderPath);
		const files: TFile[] = [];

		if (folder) {
			for (const child of this.app.vault.getMarkdownFiles()) {
				if (child.path.startsWith(folderPath + '/') || child.path === folderPath) {
					files.push(child);
				}
			}
		}

		// 按更新时间倒序排序
		files.sort((a, b) => b.stat.mtime - a.stat.mtime);

		this.allNotes = [];
		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			const fm = (cache?.frontmatter as StickyNoteMeta) || {};
			const raw = await this.app.vault.read(file);

			// 提取摘要（去掉 YAML frontmatter）
			let body = raw;
			if (body.startsWith('---')) {
				const endIdx = body.indexOf('\n---', 3);
				if (endIdx !== -1) {
					body = body.slice(endIdx + 4).trimStart();
				}
			}

			const snippet = body.replace(/#+ /g, '').replace(/[-*]\s+/g, '').slice(0, 120).trim();

			this.allNotes.push({
				file,
				title: file.basename,
				snippet: snippet || '(空白便签)',
				color: fm.color || this.plugin.settings.defaultColor,
				pinned: fm.pinned ?? false,
				updatedAt: file.stat.mtime,
			});
		}
	}

	/**
	 * 渲染便签卡片列表
	 */
	private renderCards() {
		this.cardsContainer.empty();

		const filtered = this.allNotes.filter((note) => {
			if (!this.searchQuery) return true;
			return (
				note.title.toLowerCase().includes(this.searchQuery) ||
				note.snippet.toLowerCase().includes(this.searchQuery)
			);
		});

		if (filtered.length === 0) {
			const emptyEl = this.cardsContainer.createDiv({ cls: 'sticky-hub-empty' });
			emptyEl.setText(t('hubNoNotes'));
			return;
		}

		for (const note of filtered) {
			const colorInfo = STICKY_COLORS[note.color] || STICKY_COLORS.yellow;
			if (!colorInfo) continue;

			const card = this.cardsContainer.createDiv({ cls: 'sticky-hub-card' });
			card.style.setProperty('--card-bg-color', colorInfo.bg);
			card.style.setProperty('--card-border-color', colorInfo.border);
			card.style.setProperty('--card-header-color', colorInfo.header);
			card.style.setProperty('--card-text-color', colorInfo.text);

			// 卡片顶条
			const topBar = card.createDiv({ cls: 'sticky-hub-card-top' });
			const dateStr = new Date(note.updatedAt).toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
			topBar.createSpan({ cls: 'sticky-hub-card-date', text: dateStr });

			if (note.pinned) {
				const pinIcon = topBar.createSpan({ cls: 'sticky-hub-card-pin' });
				setIcon(pinIcon, 'pin');
			}

			// 卡片正文
			const titleEl = card.createDiv({ cls: 'sticky-hub-card-title' });
			titleEl.setText(note.title);

			const bodyEl = card.createDiv({ cls: 'sticky-hub-card-snippet' });
			bodyEl.setText(note.snippet);

			// 点击卡片直接在桌面独立窗口打开
			card.onclick = async () => {
				this.close();
				await this.plugin.windowManager.openStickyNote(note.file);
			};

			// 删除按钮
			const delBtn = card.createDiv({
				cls: 'sticky-hub-card-delete',
				title: t('tbDelete'),
			});
			setIcon(delBtn, 'trash-2');
			delBtn.onclick = async (e) => {
				e.stopPropagation();
				await this.app.fileManager.trashFile(note.file);
				new Notice(t('noticeDeleted'));
				this.allNotes = this.allNotes.filter((n) => n.file.path !== note.file.path);
				this.renderCards();
			};
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
