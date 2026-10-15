import { getLanguage } from 'obsidian';

/**
 * 国际化多语言支持模块 (i18n)
 */

export type Locale = 'zh' | 'en';

const zh = {
	// 文件名前缀
	filePrefix: '便笺',

	// Ribbon & 命令
	ribbonTitle: '新建桌面便笺',
	ribbonHubTitle: '打开桌面便笺管理器',
	cmdNewSticky: '新建桌面便笺',
	cmdOpenCurrent: '将当前笔记以桌面便笺打开',
	cmdOpenHub: '打开桌面便笺管理器',
	menuOpenAsSticky: '以桌面便笺打开',

	// 工具栏 Tooltip
	tbNew: '新建便笺',
	tbPin: '置顶便笺 / 取消置顶',
	tbSkin: '更改便笺皮肤',
	tbTodo: '待办事项 (支持单行或多行选中批量切换)',
	tbBullet: '项目符号列表 (支持多选批量转换)',
	tbNumber: '编号列表 (支持多选自动递增编号)',
	tbStrike: '删除线',
	tbImage: '从资源管理器选择图片插入 (或直接 Ctrl+V 粘贴)',
	tbTitle: '显示/隐藏笔记标题',
	tbYaml: '显示/隐藏元数据 (YAML)',
	tbRestoreToMain: '恢复为正常窗口 (收回至主库)',
	tbDelete: '移入废纸篓 (删除便笺)',
	tbClose: '关闭便笺 (随时可在管理器找回)',

	// 三态窗口模式 Tooltip
	modeFloatTooltip: '当前：普通浮动 (点击切换为置顶)',
	modePinTooltip: '当前：窗口置顶 (点击切换为桌面贴纸)',
	modeDockTooltip: '当前：桌面贴纸 (点击恢复为普通浮动)',
	modeTwoFloatTooltip: '当前：未置顶 (点击置顶)',
	modeTwoPinTooltip: '当前：已置顶 (点击取消置顶)',

	// 通知 Notice
	noticePinned: '便笺已置顶',
	noticeUnpinned: '便笺已取消置顶',
	noticeDocked: '已切换为桌面贴纸模式 (非置顶/任务栏隐藏)',
	noticeFloat: '便笺已恢复为普通浮动',
	noticeRestoredToMain: '已恢复至主窗口打开',
	noticeTitleShow: '已显示笔记标题',
	noticeTitleHide: '已隐藏笔记标题',
	noticeYamlShow: '已显示元数据 (YAML)',
	noticeYamlHide: '已隐藏元数据 (YAML)',
	noticeImgSuccess: '图片已成功插入',
	noticeImgFail: '插入图片失败，请重试',
	noticeDeleted: '便笺已安全移入废纸篓',

	// 便笺管理器 Hub
	hubTitle: '桌面便笺管理器',
	hubSearchPlaceholder: '搜索便笺内容或标题...',
	hubNoNotes: '未找到便笺',
	hubNewBtn: '新建便笺',
	hubConfirmDelete: '确定将此便笺移入废纸篓吗？',

	// 颜色名称
	colorYellow: '经典黄',
	colorGreen: '薄荷绿',
	colorPink: '樱花粉',
	colorBlue: '晴空蓝',
	colorPurple: '香芋紫',
	colorWhite: '简约白',
	colorCharcoal: '暗夜碳黑',

	// 设置面板
	settingHeading: '常规设置',
	settingFolder: '便笺保存目录',
	settingFolderDesc: '新建便笺时默认保存的 Vault 文件夹路径',
	settingDefaultColor: '新建便笺默认配色',
	settingDefaultColorDesc: '新创建便笺时的初始便笺纸皮肤',
	settingWidth: '默认宽度 (px)',
	settingWidthDesc: '桌面便笺弹出时的默认初始宽度',
	settingHeight: '默认高度 (px)',
	settingHeightDesc: '桌面便笺弹出时的默认初始高度',
	settingPinned: '默认窗口置顶',
	settingPinnedDesc: '新建便笺时是否默认保持在桌面最前',
	settingAutoHideToolbar: '鼠标离开便笺时自动隐藏工具栏',
	settingAutoHideToolbarDesc: '鼠标移入便笺窗口时平滑显示工具栏，移出时自动隐藏，提供极致清爽的便笺纸体验',
	settingHideFromTaskbar: '从系统任务栏隐藏便笺图标',
	settingHideFromTaskbarDesc: '开启后，便笺小窗不占用系统任务栏位置，仅保留一个主程序图标 (仅 Windows / Linux 生效)',
	settingPinMode: 'Pin 按钮切换模式',
	settingPinModeDesc: '设置点击工具栏 Pin 图标时的状态流转行为',
	settingPinModeThree: '三态流转 (浮动 ➔ 置顶 ➔ 桌面贴纸)',
	settingPinModeTwo: '经典二态 (仅 浮动 ➔ 置顶)',
};

const en: typeof zh = {
	// File prefix
	filePrefix: 'Sticky',

	// Ribbon & Commands
	ribbonTitle: 'New desktop sticky note',
	ribbonHubTitle: 'Open desktop sticky notes hub',
	cmdNewSticky: 'New desktop sticky note',
	cmdOpenCurrent: 'Open current note as desktop sticky note',
	cmdOpenHub: 'Open desktop sticky notes hub',
	menuOpenAsSticky: 'Open as desktop sticky note',

	// Toolbar Tooltips
	tbNew: 'New sticky note',
	tbPin: 'Pin sticky note / Unpin',
	tbSkin: 'Change note skin',
	tbTodo: 'Checklist (Supports multi-line toggle)',
	tbBullet: 'Bulleted list (Multi-line supported)',
	tbNumber: 'Numbered list (Auto-increment on selection)',
	tbStrike: 'Strikethrough',
	tbImage: 'Insert image from file explorer (or Ctrl+V to paste)',
	tbTitle: 'Show/hide note title',
	tbYaml: 'Show/hide metadata (YAML)',
	tbRestoreToMain: 'Restore to main window',
	tbDelete: 'Move to trash (Delete note)',
	tbClose: 'Close sticky note (Retrievable from Hub)',

	// Three-state Window Mode Tooltips
	modeFloatTooltip: 'Current: Floating (Click to pin)',
	modePinTooltip: 'Current: Pinned (Click to desktop sticker)',
	modeDockTooltip: 'Current: Desktop sticker (Click to float)',
	modeTwoFloatTooltip: 'Current: Unpinned (Click to pin)',
	modeTwoPinTooltip: 'Current: Pinned (Click to unpin)',

	// Notices
	noticePinned: 'Sticky note pinned',
	noticeUnpinned: 'Sticky note unpinned',
	noticeDocked: 'Switched to desktop sticker mode (Unpinned/Taskbar hidden)',
	noticeFloat: 'Sticky note restored to floating',
	noticeRestoredToMain: 'Restored to main window',
	noticeTitleShow: 'Note title visible',
	noticeTitleHide: 'Note title hidden',
	noticeYamlShow: 'Metadata (YAML) visible',
	noticeYamlHide: 'Metadata (YAML) hidden',
	noticeImgSuccess: 'Image inserted successfully',
	noticeImgFail: 'Failed to insert image, please retry',
	noticeDeleted: 'Sticky note moved to trash',

	// Notes Hub
	hubTitle: 'Desktop Sticky Notes Hub',
	hubSearchPlaceholder: 'Search sticky notes by title or content...',
	hubNoNotes: 'No sticky notes found',
	hubNewBtn: 'New note',
	hubConfirmDelete: 'Are you sure you want to move this note to trash?',

	// Color Names
	colorYellow: 'Classic Yellow',
	colorGreen: 'Mint Green',
	colorPink: 'Sakura Pink',
	colorBlue: 'Sky Blue',
	colorPurple: 'Taro Purple',
	colorWhite: 'Minimal White',
	colorCharcoal: 'Charcoal Dark',

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
	settingAutoHideToolbarDesc: 'Smoothly show toolbar on hover and auto-hide when mouse leaves for a distraction-free experience',
	settingHideFromTaskbar: 'Hide sticky notes from taskbar',
	settingHideFromTaskbarDesc: 'Keep only the main Obsidian icon on the taskbar, without cluttering with sticky note windows (Windows / Linux only)',
	settingPinMode: 'Pin button cycling mode',
	settingPinModeDesc: 'State cycling behavior when clicking the toolbar Pin icon',
	settingPinModeThree: 'Three-state (Floating ➔ Pinned ➔ Sticker)',
	settingPinModeTwo: 'Classic two-state (Floating ➔ Pinned only)',
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
