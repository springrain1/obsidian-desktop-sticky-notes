/**
 * Electron 窗口操作辅助工具
 */

interface ElectronWindow {
	setAlwaysOnTop(this: void, flag: boolean, level?: string): void;
	setSkipTaskbar?(this: void, skip: boolean): void;
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

/**
 * 提取当前目标窗口对应的 Electron 原生 BrowserWindow 实例
 */
function getTargetBrowserWindow(targetWindow: Window): ElectronWindow | null {
	try {
		const win = targetWindow as WindowWithElectron;
		const req = win.require ?? (window as WindowWithElectron).require;
		if (typeof req === 'function') {
			const electron = req('electron');
			const remoteModule = req('@electron/remote');
			const remote: ElectronRemote | undefined = remoteModule ?? electron?.remote;

			// 优先获取 targetWindow 对应的原生 BrowserWindow 实例，杜绝误钉或误操作其他窗口
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

			return targetBw;
		}
	} catch (e) {
		console.warn('[DesktopStickyNotes] Failed to get target BrowserWindow:', e);
	}
	return null;
}

/**
 * 设置便笺窗口置顶
 */
export function setWindowTopmost(targetWindow: Window, isPinned: boolean): boolean {
	const bw = getTargetBrowserWindow(targetWindow);
	if (bw) {
		try {
			bw.setAlwaysOnTop(isPinned, 'floating');
			return true;
		} catch (e) {
			console.warn('[DesktopStickyNotes] setAlwaysOnTop failed:', e);
		}
	}
	return false;
}

/**
 * 设置从任务栏隐藏/恢复便笺窗口 (Windows / Linux)
 */
export function setWindowSkipTaskbar(targetWindow: Window, skip = true): boolean {
	const bw = getTargetBrowserWindow(targetWindow);
	if (bw && typeof bw.setSkipTaskbar === 'function') {
		try {
			bw.setSkipTaskbar(skip);
			return true;
		} catch (e) {
			console.debug('[DesktopStickyNotes] setSkipTaskbar not supported or failed on this platform:', e);
		}
	}
	return false;
}
