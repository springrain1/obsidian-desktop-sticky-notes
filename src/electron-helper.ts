/**
 * Electron 窗口操作辅助工具
 */

interface ElectronWindow {
	setAlwaysOnTop(this: void, flag: boolean, level?: string): void;
}

interface ElectronRemote {
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
			const remote: ElectronRemote | undefined = remoteModule ?? electron.remote;
			const focused = remote?.BrowserWindow?.getFocusedWindow() ?? electron.BrowserWindow?.getFocusedWindow();
			if (focused) {
				focused.setAlwaysOnTop(isPinned, 'floating');
				return true;
			}
		}
	} catch (e) {
		console.warn('[EvernoteStickyNote] setAlwaysOnTop failed or unsupported:', e);
	}
	return false;
}
