/**
 * Electron 窗口操作辅助工具
 */

interface ElectronWindow {
	setAlwaysOnTop(this: void, flag: boolean, level?: string): void;
}

interface ElectronRemote {
	getCurrentWindow?(this: void): ElectronWindow;
	BrowserWindow?: {
		getFocusedWindow(this: void): ElectronWindow | null;
	};
}

interface WindowWithElectron extends Window {
	require?(this: void, module: string): {
		remote?: ElectronRemote;
		BrowserWindow?: {
			getFocusedWindow(this: void): ElectronWindow | null;
		};
	};
}

export function setWindowTopmost(targetWindow: Window, isPinned: boolean): boolean {
	try {
		const win = targetWindow as WindowWithElectron;
		const req = win.require ?? (window as WindowWithElectron).require;
		if (typeof req === 'function') {
			const electron = req('electron');
			const remoteModule = req('@electron/remote');
			const remote: ElectronRemote | undefined = remoteModule ?? electron?.remote;

			// 优先获取 targetWindow 对应的原生 BrowserWindow 实例，杜绝误钉当前焦点窗口
			let targetBw: ElectronWindow | null = null;
			if (typeof remote?.getCurrentWindow === 'function') {
				try {
					targetBw = remote.getCurrentWindow();
				} catch {
					// 跨上下文无法直接获取时回退
				}
			}

			if (!targetBw) {
				targetBw = remote?.BrowserWindow?.getFocusedWindow() ?? electron?.BrowserWindow?.getFocusedWindow() ?? null;
			}

			if (targetBw) {
				targetBw.setAlwaysOnTop(isPinned, 'floating');
				return true;
			}
		}
	} catch (e) {
		console.warn('[DesktopStickyNotes] setAlwaysOnTop failed or unsupported:', e);
	}
	return false;
}
