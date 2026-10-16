import type { ChildProcess } from 'child_process';

/**
 * Win32 桌面小组件守护进程 (stdin 管道化，惰性初始化，零黑框)
 */
let workerProc: ChildProcess | null = null;

const CSHARP_CODE = `
using System;
using System.IO;
using System.Runtime.InteropServices;
public class Win32Bridge {
    [DllImport("user32.dll", CharSet=CharSet.Unicode)]
    public static extern IntPtr FindWindow(string cls, string title);
    [DllImport("user32.dll", EntryPoint="SetWindowLongPtr")]
    public static extern IntPtr SetWindowLongPtr(IntPtr hWnd, int nIndex, IntPtr dwNewLong);
    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);

    public static void Run() {
        IntPtr progman = FindWindow("Progman", "Program Manager");
        string line;
        while ((line = Console.ReadLine()) != null) {
            try {
                string[] parts = line.Trim().Split(' ');
                if (parts.Length < 2) continue;
                string cmd = parts[0];
                IntPtr hwnd = new IntPtr(Convert.ToInt64(parts[1], 16));

                if (cmd == "ATTACH") {
                    if (progman == IntPtr.Zero) progman = FindWindow("Progman", "Program Manager");
                    SetWindowLongPtr(hwnd, -8, progman); // GWLP_HWNDPARENT = -8
                    SetWindowPos(hwnd, new IntPtr(1), 0, 0, 0, 0, 0x0013); // HWND_BOTTOM = 1, SWP_NOMOVE|SWP_NOSIZE|SWP_NOACTIVATE = 0x0013
                } else if (cmd == "DETACH") {
                    SetWindowLongPtr(hwnd, -8, IntPtr.Zero);
                    SetWindowPos(hwnd, new IntPtr(-2), 0, 0, 0, 0, 0x0013); // HWND_NOTOPMOST = -2
                } else if (cmd == "BOTTOM") {
                    SetWindowPos(hwnd, new IntPtr(1), 0, 0, 0, 0, 0x0013); // HWND_BOTTOM = 1
                }
            } catch {}
        }
    }
}
`;

function ensureWorker() {
	if (workerProc && workerProc.stdin && workerProc.stdin.writable) return;
	if (process.platform !== 'win32') return;

	const psScript = `\n$code = @'\n${CSHARP_CODE}\n'@\nAdd-Type -TypeDefinition $code\n[Win32Bridge]::Run()\n`;
	const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
	const win = window as unknown as { require?: (module: string) => unknown };
	const cp = (typeof win.require === 'function' ? win.require('child_process') : null) as typeof import('child_process') | null;

	if (!cp || typeof cp.spawn !== 'function') return;

	try {
		workerProc = cp.spawn('powershell.exe', [
			'-NoProfile',
			'-NonInteractive',
			'-EncodedCommand',
			encoded,
		], {
			windowsHide: true,
			stdio: ['pipe', 'ignore', 'ignore'],
		});

		workerProc.on('exit', () => {
			workerProc = null;
		});
	} catch (e) {
		console.warn('[DesktopStickies] Failed to spawn Win32 worker:', e);
	}
}

/**
 * 向 Win32 守护进程发送管道指令 (首次调用时惰性冷启动)
 */
export function sendWin32Command(cmd: 'ATTACH' | 'DETACH' | 'BOTTOM', hwndHex: string) {
	if (process.platform !== 'win32') return;
	ensureWorker();
	try {
		workerProc?.stdin?.write(`${cmd} ${hwndHex}\n`);
	} catch (e) {
		console.warn('[DesktopStickies] Failed to write to Win32 worker:', e);
	}
}

/**
 * 插件卸载或退出时终结守护进程
 */
export function destroyWin32Worker() {
	if (workerProc) {
		try {
			workerProc.kill();
		} catch {
			// 容错
		}
		workerProc = null;
	}
}
