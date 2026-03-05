const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const fs = require('fs');
const crypto = require('crypto');

const isDev = process.env.NODE_ENV === 'development';

// Get user data path for secure storage
const userDataPath = app.getPath('userData');
const dataDir = path.join(userDataPath, 'TimeData');
const attachDir = path.join(dataDir, 'attachments');
const mdDir = path.join(dataDir, 'notes');

[dataDir, attachDir, mdDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

console.log('--- DAILYMANAGER DATA DIRECTORY ---');
console.log(dataDir);
console.log('-----------------------------------');

function createWindow() {
    // Set window title with current date
    const today = new Date();
    const dateStr = today.toLocaleDateString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short'
    });

    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 860,
        minWidth: 900,
        minHeight: 600,
        title: `DailyManager — ${dateStr}`,
        backgroundColor: '#0f0f11',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            webSecurity: false,
            preload: path.join(__dirname, 'preload.cjs')
        }
    });

    // Remove default menu bar for cleaner look
    mainWindow.setMenuBarVisibility(false);

    // Prevent navigation to stray dropped files (prevents black screen on missed drops)
    mainWindow.webContents.on('will-navigate', (e, url) => {
        if (!url.startsWith('http://localhost') && !url.startsWith('devtools://')) {
            e.preventDefault();
        }
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        // 개발 모드에서 개발자 도구 자동 열기
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

// IPC Handlers for File System Access
app.whenReady().then(() => {
    // ---- Schedule JSON Metadata ----
    const scheduleFile = path.join(dataDir, 'schedule_meta.json');

    // Load entire schedule metadata
    ipcMain.handle('load-schedule-meta', async () => {
        try {
            if (fs.existsSync(scheduleFile)) {
                return JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
            }
            return {};
        } catch (e) {
            console.error('Failed to load schedule meta', e);
            return {};
        }
    });

    // Save entire schedule metadata
    ipcMain.handle('save-schedule-meta', async (event, data) => {
        try {
            fs.writeFileSync(scheduleFile, JSON.stringify(data, null, 2), 'utf8');
            return { success: true };
        } catch (e) {
            console.error('Failed to save schedule meta', e);
            return { success: false, error: e.message };
        }
    });

    // ---- Markdown Files ----
    // Write individual markdown file with frontmatter
    ipcMain.handle('save-markdown', async (event, blockId, dateStr, frontmatter, mdContent) => {
        try {
            const fileName = `${dateStr}_${blockId}.md`;
            const filePath = path.join(mdDir, fileName);

            let fmStr = '---\n';
            for (const [key, val] of Object.entries(frontmatter)) {
                fmStr += `${key}: ${val}\n`;
            }
            fmStr += '---\n\n';

            fs.writeFileSync(filePath, fmStr + mdContent, 'utf8');
            return { success: true };
        } catch (e) {
            console.error('Failed to save markdown', e);
            return { success: false, error: e.message };
        }
    });

    // Read individual markdown file
    ipcMain.handle('load-markdown', async (event, blockId, dateStr) => {
        try {
            const fileName = `${dateStr}_${blockId}.md`;
            const filePath = path.join(mdDir, fileName);
            if (fs.existsSync(filePath)) {
                const raw = fs.readFileSync(filePath, 'utf8');
                // Strip frontmatter for the editor
                const match = raw.match(/^---\n[\s\S]*?\n---\n\n([\s\S]*)$/);
                if (match) {
                    return match[1];
                }
                return raw;
            }
            return '';
        } catch (e) {
            console.error('Failed to load markdown', e);
            return '';
        }
    });

    // ---- Image Attachments ----
    ipcMain.handle('save-image', async (event, base64Data, extension) => {
        try {
            const fileName = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${extension}`;
            const filePath = path.join(attachDir, fileName);

            // Remove header from base64 (e.g., data:image/png;base64,)
            const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
            const imageBuffer = Buffer.from(base64Image, 'base64');

            fs.writeFileSync(filePath, imageBuffer);

            // Return relative path or file:// URL depending on how UI renders it
            return { success: true, url: `file://${filePath}` };
        } catch (e) {
            console.error('Failed to save image', e);
            return { success: false, error: e.message };
        }
    });

    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
