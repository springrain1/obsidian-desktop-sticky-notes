/**
 * Win32 桌面小组件守护进程 (stdin 管道化，零重复启动开销)
 */

interface ChildProcessLike {
	stdin?: {
		writable?: boolean;
		write: (data: string) => boolean;
		end: () => void;
	} | null;
	stdout?: {
		on: (event: string, listener: (data: Buffer) => void) => void;
	} | null;
	on: (event: string, listener: () => void) => void;
	kill: () => void;
}

interface ChildProcessModule {
	spawn: (
		command: string,
		args: string[],
		options: {
			windowsHide?: boolean;
			stdio?: (string | null)[];
		},
	) => ChildProcessLike;
}

class Win32WidgetWorker {
	private static instance: Win32WidgetWorker;
	private process: ChildProcessLike | null = null;
	private isReady = false;

	private constructor() {
		if (process.platform === 'win32') {
			this.initWorker();
		}
	}

	public static getInstance(): Win32WidgetWorker {
		if (!Win32WidgetWorker.instance) {
			Win32WidgetWorker.instance = new Win32WidgetWorker();
		}
		return Win32WidgetWorker.instance;
	}

	private initWorker() {
		if (process.platform !== 'win32') return;

		// C# 核心 P/Invoke 定义
		const csharpCode = `
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
    [DllImport("user32.dll")]
    public static extern IntPtr GetWindow(IntPtr hWnd, uint uCmd);

    public static void Run() {
        IntPtr progman = FindWindow("Progman", "Program Manager");
        Console.WriteLine("READY");
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
		// PowerShell 包装脚本：编译后直接进入常驻循环
		const psScript = `
$code = @'
${csharpCode}
'@
Add-Type -TypeDefinition $code
[Win32Bridge]::Run()
`;
		// 采用 UTF-16LE + Base64 编码传递，免疫命令行换行与双引号截断
		const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
		const win = window as unknown as { require?: (module: string) => unknown };
		const electronApp = (typeof win.require === 'function' ? win.require('child_process') : null) as ChildProcessModule | null;

		if (!electronApp || typeof electronApp.spawn !== 'function') {
			return;
		}

		try {
			this.process = electronApp.spawn('powershell.exe', [
				'-NoProfile',
				'-NonInteractive',
				'-EncodedCommand',
				encoded,
			], {
				windowsHide: true,
				stdio: ['pipe', 'pipe', 'ignore'],
			});

			this.process.stdout?.on('data', (data: Buffer) => {
				if (data.toString().includes('READY')) {
					this.isReady = true;
				}
			});

			this.process.on('exit', () => {
				this.isReady = false;
				this.process = null;
			});
		} catch (e) {
			console.warn('[DesktopStickies] Failed to spawn Win32 worker:', e);
		}
	}

	public sendCommand(cmd: 'ATTACH' | 'DETACH' | 'BOTTOM', hwndHex: string) {
		if (process.platform !== 'win32') return;

		if (!this.process || !this.process.stdin || !this.process.stdin.writable) {
			// 异常退出时自愈重启
			this.initWorker();
		}
		try {
			this.process?.stdin?.write(`${cmd} ${hwndHex}\n`);
		} catch (e) {
			console.warn('[DesktopStickies] Failed to write to Win32 worker:', e);
		}
	}

	public destroy() {
		if (this.process) {
			try {
				this.process.stdin?.end();
				this.process.kill();
			} catch {
				// 容错
			}
			this.process = null;
		}
	}
}

export const win32Worker = Win32WidgetWorker.getInstance();
