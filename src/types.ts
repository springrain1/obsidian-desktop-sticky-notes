import { t } from './i18n';

export interface StickyColorInfo {
	id: string;
	name: string;
	bg: string;
	border: string;
	header: string;
	text: string;
}

export const STICKY_COLORS: Record<string, StickyColorInfo> = {
	yellow: {
		id: 'yellow',
		name: 'Classic Yellow',
		bg: '#FFF8B8',
		border: '#E8DC84',
		header: '#F9EE9B',
		text: '#222222',
	},
	green: {
		id: 'green',
		name: 'Mint Green',
		bg: '#D8F3DC',
		border: '#B7E4C7',
		header: '#C8EACD',
		text: '#1C3A27',
	},
	pink: {
		id: 'pink',
		name: 'Sakura Pink',
		bg: '#FFE3E3',
		border: '#F8B4B4',
		header: '#F5C6CB',
		text: '#3C1E22',
	},
	blue: {
		id: 'blue',
		name: 'Sky Blue',
		bg: '#E0F2FE',
		border: '#BAE6FD',
		header: '#CCE9FA',
		text: '#13354B',
	},
	purple: {
		id: 'purple',
		name: 'Taro Purple',
		bg: '#F3E8FF',
		border: '#E9D5FF',
		header: '#E4D4F7',
		text: '#341D4E',
	},
	white: {
		id: 'white',
		name: 'Minimal White',
		bg: '#FFFFFF',
		border: '#E0E0E0',
		header: '#F2F2F2',
		text: '#2A2A2A',
	},
	charcoal: {
		id: 'charcoal',
		name: 'Charcoal Dark',
		bg: '#202020',
		border: '#383838',
		header: '#2B2B2B',
		text: '#E2E8F0',
	},
};

export function getStickyColorName(colorId: string): string {
	switch (colorId) {
		case 'yellow': return t('colorYellow');
		case 'green': return t('colorGreen');
		case 'pink': return t('colorPink');
		case 'blue': return t('colorBlue');
		case 'purple': return t('colorPurple');
		case 'white': return t('colorWhite');
		case 'charcoal': return t('colorCharcoal');
		default: return colorId;
	}
}

export interface StickyNoteMeta {
	is_sticky?: boolean;
	pinned?: boolean;
	color?: string;
	bounds?: {
		x?: number;
		y?: number;
		width?: number;
		height?: number;
	};
	created_at?: string;
	updated_at?: string;
}

export interface StickyPluginSettings {
	notesFolder: string;
	defaultColor: string;
	defaultWidth: number;
	defaultHeight: number;
	defaultPinned: boolean;
	autoSaveDelayMs: number;
	autoHideToolbar: boolean;
}

export const DEFAULT_SETTINGS: StickyPluginSettings = {
	notesFolder: 'Sticky Notes',
	defaultColor: 'yellow',
	defaultWidth: 320,
	defaultHeight: 380,
	defaultPinned: false,
	autoSaveDelayMs: 400,
	autoHideToolbar: true,
};
