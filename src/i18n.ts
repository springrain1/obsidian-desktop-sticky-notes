import { getLanguage } from 'obsidian';

/**
 * 国际化多语言支持模块 (i18n)
 */

export type Locale = 'zh' | 'en';

const zh = {
	// Ribbon & 命令
	ribbonTitle: '新建印象桌面便签',
	cmdNewSticky: '新建桌面便签',
	cmdOpenCurrent: '将当前笔记以桌面便签打开',
	menuOpenAsSticky: '以桌面便签打开',

	// 工具栏 Tooltip
	tbNew: '新建便签 (Ctrl+Alt+S)',
	tbPin: '置顶便签 / 取消置顶',
	tbSkin: '更改便签皮肤',
	tbTodo: '待办事项 (支持单行或多行选中批量切换)',
	tbBullet: '项目符号列表 (支持多选批量转换)',
	tbNumber: '编号列表 (支持多选自动递增编号)',
	tbStrike: '删除线',
	tbImage: '从资源管理器选择图片插入 (或直接 Ctrl+V 粘贴)',
	tbTitle: '显示/隐藏笔记标题',
	tbYaml: '显示/隐藏元数据 (YAML)',
	tbClose: '关闭便签',

	// 通知 Notice
	noticePinned: '便签已置顶',
	noticeUnpinned: '便签已取消置顶',
	noticeTitleShow: '已显示笔记标题',
	noticeTitleHide: '已隐藏笔记标题',
	noticeYamlShow: '已显示元数据 (YAML)',
	noticeYamlHide: '已隐藏元数据 (YAML)',
	noticeImgSuccess: '图片已成功插入',
	noticeImgFail: '插入图片失败，请重试',

	// 颜色名称
	colorYellow: '经典黄',
	colorGreen: '薄荷绿',
	colorPink: '樱花粉',
	colorBlue: '晴空蓝',
	colorPurple: '香芋紫',
	colorWhite: '简约白',

	// 设置面板
	settingHeading: '常规设置',
	settingFolder: '便签保存目录',
	settingFolderDesc: '新建便签时默认保存的 Vault 文件夹路径',
	settingDefaultColor: '新建便签默认配色',
	settingDefaultColorDesc: '新创建便签时的初始便签纸皮肤',
	settingWidth: '默认宽度 (px)',
	settingWidthDesc: '桌面便签弹出时的默认初始宽度',
	settingHeight: '默认高度 (px)',
	settingHeightDesc: '桌面便签弹出时的默认初始高度',
	settingPinned: '默认窗口置顶',
	settingPinnedDesc: '新建便签时是否默认保持在桌面最前',
	settingAutoHideToolbar: '鼠标离开便签时自动隐藏工具栏',
	settingAutoHideToolbarDesc: '鼠标移入便签窗口时平滑显示工具栏，移出时自动隐藏，还原印象笔记极简便签体验',
	settingDelay: '自动存盘延迟 (毫秒)',
	settingDelayDesc: '编辑停止后自动保存到 Markdown 文件的防抖延迟',
};

const en: typeof zh = {
	// Ribbon & Commands
	ribbonTitle: 'New Evernote sticky note',
	cmdNewSticky: 'New sticky note',
	cmdOpenCurrent: 'Open current note as sticky note',
	menuOpenAsSticky: 'Open as sticky note',

	// Toolbar Tooltips
	tbNew: 'New sticky note (Ctrl+Alt+S)',
	tbPin: 'Pin sticky note / Unpin',
	tbSkin: 'Change note skin',
	tbTodo: 'Checklist (Supports multi-line toggle)',
	tbBullet: 'Bulleted list (Multi-line supported)',
	tbNumber: 'Numbered list (Auto-increment on selection)',
	tbStrike: 'Strikethrough',
	tbImage: 'Insert image from file explorer (or Ctrl+V to paste)',
	tbTitle: 'Show/hide note title',
	tbYaml: 'Show/hide metadata (YAML)',
	tbClose: 'Close sticky note',

	// Notices
	noticePinned: 'Sticky note pinned',
	noticeUnpinned: 'Sticky note unpinned',
	noticeTitleShow: 'Note title visible',
	noticeTitleHide: 'Note title hidden',
	noticeYamlShow: 'Metadata (YAML) visible',
	noticeYamlHide: 'Metadata (YAML) hidden',
	noticeImgSuccess: 'Image inserted successfully',
	noticeImgFail: 'Failed to insert image, please retry',

	// Color Names
	colorYellow: 'Classic Yellow',
	colorGreen: 'Mint Green',
	colorPink: 'Sakura Pink',
	colorBlue: 'Sky Blue',
	colorPurple: 'Taro Purple',
	colorWhite: 'Minimal White',

	// Settings Tab
	settingHeading: 'General settings',
	settingFolder: 'Sticky notes folder',
	settingFolderDesc: 'Default vault folder for newly created sticky notes',
	settingDefaultColor: 'Default note color',
	settingDefaultColorDesc: 'Initial sticky note skin for newly created notes',
	settingWidth: 'Default width (px)',
	settingWidthDesc: 'Default initial width when note window pops out',
	settingHeight: 'Default height (px)',
	settingHeightDesc: 'Default initial height when note window pops out',
	settingPinned: 'Default window pinned',
	settingPinnedDesc: 'Whether sticky notes stay on top by default',
	settingAutoHideToolbar: 'Auto-hide toolbar when cursor leaves',
	settingAutoHideToolbarDesc: 'Smoothly show toolbar on hover and auto-hide when mouse leaves, reproducing the classic Evernote sticky note experience',
	settingDelay: 'Auto-save delay (ms)',
	settingDelayDesc: 'Debounce delay before auto-saving to Markdown file',
};

export type TranslationKey = keyof typeof zh;

/**
 * 获取当前 Obsidian 运行环境语言
 */
export function getCurrentLocale(): Locale {
	try {
		const lang = getLanguage();
		if (lang && lang.toLowerCase().startsWith('zh')) {
			return 'zh';
		}
	} catch {
		// 默认回退
	}
	return 'en';
}

/**
 * 翻译文本函数
 */
export function t(key: TranslationKey): string {
	const locale = getCurrentLocale();
	const dict = locale === 'zh' ? zh : en;
	return dict[key] ?? zh[key] ?? key;
}
