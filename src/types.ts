import { t, TranslationKey } from './i18n';

export interface StickyColorInfo {
	name: string;
	bg: string;
	border: string;
	header: string;
	text: string;
}

export const STICKY_COLORS: Record<string, StickyColorInfo> = {
	yellow: {
		name: 'Classic Yellow',
		bg: '#FFF8B8',
		border: '#E8DC84',
		header: '#F9EE9B',
		text: '#222222',
	},
	green: {
		name: 'Mint Green',
		bg: '#D8F3DC',
		border: '#B7E4C7',
		header: '#C8EACD',
		text: '#1C3A27',
	},
	pink: {
		name: 'Sakura Pink',
		bg: '#FFE3E3',
		border: '#F8B4B4',
		header: '#F5C6CB',
		text: '#3C1E22',
	},
	blue: {
		name: 'Sky Blue',
		bg: '#E0F2FE',
		border: '#BAE6FD',
		header: '#CCE9FA',
		text: '#13354B',
	},
	purple: {
		name: 'Taro Purple',
		bg: '#F3E8FF',
		border: '#E9D5FF',
		header: '#E4D4F7',
		text: '#341D4E',
	},
	white: {
		name: 'Minimal White',
		bg: '#FFFFFF',
		border: '#E0E0E0',
		header: '#F2F2F2',
		text: '#2A2A2A',
	},
	charcoal: {
		name: 'Charcoal Dark',
		bg: '#202020',
		border: '#383838',
		header: '#2B2B2B',
		text: '#E2E8F0',
	},
};

const COLOR_TRANSLATION_MAP: Record<string, TranslationKey> = {
	yellow: 'colorYellow',
	green: 'colorGreen',
	pink: 'colorPink',
	blue: 'colorBlue',
	purple: 'colorPurple',
	white: 'colorWhite',
	charcoal: 'colorCharcoal',
};

export function getStickyColorName(colorKey: string): string {
	const key = COLOR_TRANSLATION_MAP[colorKey];
	return key ? t(key) : colorKey;
}

export interface StickyNoteMeta {
	is_sticky?: boolean;
	pinned?: boolean;
	color?: string;
	bounds?: {
		width?: number;
		height?: number;
	};
	created_at?: string;
}

export interface StickyPluginSettings {
	notesFolder: string;
	defaultColor: string;
	defaultWidth: number;
	defaultHeight: number;
	defaultPinned: boolean;
	autoHideToolbar: boolean;
}

export const DEFAULT_SETTINGS: StickyPluginSettings = {
	notesFolder: 'Sticky Notes',
	defaultColor: 'yellow',
	defaultWidth: 320,
	defaultHeight: 380,
	defaultPinned: false,
	autoHideToolbar: true,
};
