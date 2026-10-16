import { App, PluginSettingTab, Setting } from 'obsidian';
import type DesktopStickyNotesPlugin from './main';
import { STICKY_COLORS, getStickyColorName } from './types';
import { t } from './i18n';

export class DesktopStickySettingTab extends PluginSettingTab {
	plugin: DesktopStickyNotesPlugin;

	constructor(app: App, plugin: DesktopStickyNotesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName(t('settingHeading'))
			.setHeading();

		new Setting(containerEl)
			.setName(t('settingFolder'))
			.setDesc(t('settingFolderDesc'))
			.addText((text) =>
				text
					.setPlaceholder('Sticky notes')
					.setValue(this.plugin.settings.notesFolder)
					.onChange(async (value) => {
						this.plugin.settings.notesFolder = value.trim() || 'Sticky Notes';
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingDefaultColor'))
			.setDesc(t('settingDefaultColorDesc'))
			.addDropdown((drop) => {
				for (const key of Object.keys(STICKY_COLORS)) {
					drop.addOption(key, getStickyColorName(key));
				}
				drop.setValue(this.plugin.settings.defaultColor);
				drop.onChange(async (value) => {
					this.plugin.settings.defaultColor = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName(t('settingWidth'))
			.setDesc(t('settingWidthDesc'))
			.addText((text) =>
				text
					.setValue(String(this.plugin.settings.defaultWidth))
					.onChange(async (val) => {
						const num = parseInt(val, 10);
						if (!isNaN(num) && num >= 200) {
							this.plugin.settings.defaultWidth = num;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl)
			.setName(t('settingHeight'))
			.setDesc(t('settingHeightDesc'))
			.addText((text) =>
				text
					.setValue(String(this.plugin.settings.defaultHeight))
					.onChange(async (val) => {
						const num = parseInt(val, 10);
						if (!isNaN(num) && num >= 200) {
							this.plugin.settings.defaultHeight = num;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl)
			.setName(t('settingPinned'))
			.setDesc(t('settingPinnedDesc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.defaultPinned)
					.onChange(async (val) => {
						this.plugin.settings.defaultPinned = val;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingAutoHideToolbar'))
			.setDesc(t('settingAutoHideToolbarDesc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoHideToolbar)
					.onChange(async (val) => {
						this.plugin.settings.autoHideToolbar = val;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingHideFromTaskbar'))
			.setDesc(t('settingHideFromTaskbarDesc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.hideFromTaskbar)
					.onChange(async (val) => {
						this.plugin.settings.hideFromTaskbar = val;
						await this.plugin.saveSettings();
						this.plugin.windowManager.updateAllNotesTaskbarVisibility(val);
					}),
			);

		new Setting(containerEl)
			.setName(t('settingPinMode'))
			.setDesc(t('settingPinModeDesc'))
			.addDropdown((dropdown) =>
				dropdown
					.addOption('three-state', t('settingPinModeThree'))
					.addOption('two-state', t('settingPinModeTwo'))
					.setValue(this.plugin.settings.pinCycleMode)
					.onChange(async (val) => {
						this.plugin.settings.pinCycleMode = val as 'three-state' | 'two-state';
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingHideFormattingToolbar'))
			.setDesc(t('settingHideFormattingToolbarDesc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.hideFormattingToolbar)
					.onChange(async (val) => {
						this.plugin.settings.hideFormattingToolbar = val;
						await this.plugin.saveSettings();
						this.plugin.windowManager.updateAllNotesFormattingToolbar(val);
					}),
			);
	}
}
