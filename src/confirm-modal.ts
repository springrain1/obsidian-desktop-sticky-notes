import { App, Modal, Setting } from 'obsidian';

export class ConfirmModal extends Modal {
	private message: string;
	private onConfirm: () => void;

	constructor(app: App, message: string, onConfirm: () => void) {
		super(app);
		this.message = message;
		this.onConfirm = onConfirm;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('p', { text: this.message, cls: 'sticky-confirm-msg' });

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText('确认')
					.setWarning()
					.onClick(() => {
						this.close();
						this.onConfirm();
					}),
			)
			.addButton((btn) =>
				btn.setButtonText('取消').onClick(() => {
					this.close();
				}),
			);
	}

	onClose() {
		this.contentEl.empty();
	}
}
