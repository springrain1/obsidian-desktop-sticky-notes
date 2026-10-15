/**
 * Electron 窗口操作辅助工具
 */

interface ElectronWindow {
	setAlwaysOnTop(this: void, flag: boolean, level?: string): void;
	setSkipTaskbar?(this: void, skip: boolean): void;
	getBounds?(this: void): { x: number; y: number; width: number; height: number };
	setPosition?(this: void, x: number, y: number, animate?: boolean): void;
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

export interface WindowBoundsInfo {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * 获取便笺窗口在屏幕上的精准物理几何坐标与内容尺寸 (规避外边框循环膨胀漂移)
 */
export function getCurrentWindowBounds(targetWindow: Window): WindowBoundsInfo {
	let x = targetWindow.screenX;
	let y = targetWindow.screenY;

	const bw = getTargetBrowserWindow(targetWindow);
	if (bw && typeof bw.getBounds === 'function') {
		try {
			const b = bw.getBounds();
			if (b && typeof b.x === 'number') {
				x = b.x;
				y = b.y;
			}
		} catch {
			// 回退
		}
	}

	// 宽度与高度严格记录内容区域尺寸 (innerWidth/innerHeight)，与 openPopoutLeaf({size}) 期望严格一致
	return {
		x,
		y,
		width: targetWindow.innerWidth,
		height: targetWindow.innerHeight,
	};
}

/**
 * 移动便笺窗口至指定屏幕坐标
 */
export function setWindowPosition(targetWindow: Window, x: number, y: number): boolean {
	const bw = getTargetBrowserWindow(targetWindow);
	if (bw && typeof bw.setPosition === 'function') {
		try {
			bw.setPosition(Math.round(x), Math.round(y));
			return true;
		} catch (e) {
			console.debug('[DesktopStickyNotes] setPosition failed:', e);
		}
	}
	try {
		targetWindow.moveTo(Math.round(x), Math.round(y));
		return true;
	} catch {
		return false;
	}
}
