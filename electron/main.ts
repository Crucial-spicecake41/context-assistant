import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Prevent "write EIO" broken-pipe errors from crashing the app when
// Electron is launched without a terminal (no stdout/stderr attached).
process.on('uncaughtException', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EIO' || err.code === 'EPIPE') return; // swallow broken-pipe
  // Re-throw anything genuinely unexpected
  throw err;
});


import {
  initDB, getTimeline, getTimelineForRange, searchTimeline, tagActivity,
  pruneOldLogs, getStatsSummary, exportLogs,
  getChatHistory, saveChatMessage, clearChatSession, getRecentSessions,
  getDailySummary, saveDailySummary,
  getSettings, updateSetting
} from './db.js';
import { startTracking } from './tracker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null;
let tray: Tray | null;

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createTray() {
  // Use a simple template icon (monochrome) for the macOS menu bar
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('Aura Context');
  const menu = Menu.buildFromTemplate([
    { label: 'Show Window', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

function createWindow() {
  const splashWindow = new BrowserWindow({
    width: 320,
    height: 380,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });

  const splashUrl = VITE_DEV_SERVER_URL 
    ? path.join(__dirname, '../electron/splash.html') 
    : path.join(__dirname, '../dist-electron/splash.html');
  
  splashWindow.loadFile(splashUrl);

  mainWindow = new BrowserWindow({
    width: 1050,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    show: false, // Don't show immediately
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#09090b',
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    // Artificial 1.5s delay for the splash to look nice, then swap
    setTimeout(() => {
      splashWindow.close();
      mainWindow?.show();
    }, 1500);
  });

  // Hide to tray instead of closing
  mainWindow.on('close', (e) => {
    if (tray) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

import { systemPreferences } from 'electron';

function checkPermissions() {
  if (process.platform === 'darwin') {
    const trusted = systemPreferences.isTrustedAccessibilityClient(false);
    if (!trusted) {
      setTimeout(() => {
        dialog.showMessageBox({
          type: 'info',
          title: 'Permission Required',
          message: 'Aura Context needs Accessibility Access',
          detail: 'To track which app is currently active, please grant Accessibility permissions in System Settings -> Privacy & Security -> Accessibility.',
          buttons: ['Open System Settings', 'Later'],
          defaultId: 0
        }).then(({ response }) => {
          if (response === 0) {
            // Re-prompting with `true` opens the system prompt
            systemPreferences.isTrustedAccessibilityClient(true);
          }
        });
      }, 3000); // 3 seconds after boot
    }
  }
}

app.on('ready', () => {
  initDB();
  const settings = getSettings();
  pruneOldLogs(parseInt(settings.retentionDays) || 30);
  startTracking();
  createWindow();
  createTray();
  checkPermissions();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

// ---- IPC: Timeline ----
ipcMain.handle('get-timeline', async (_, limit) => getTimeline(limit));
ipcMain.handle('get-timeline-range', async (_, hours, limit) => getTimelineForRange(hours, limit));
ipcMain.handle('search-timeline', async (_, query) => searchTimeline(query));
ipcMain.handle('tag-activity', async (_, id, tag) => tagActivity(id, tag));
ipcMain.handle('get-stats', async (_, hours) => getStatsSummary(hours));

// ---- IPC: Export ----
ipcMain.handle('export-logs', async (_, format: 'csv' | 'json') => {
  const logs = exportLogs() as Record<string, unknown>[];
  const { filePath } = await dialog.showSaveDialog({
    title: 'Export Activity Logs',
    defaultPath: `context-logs-${new Date().toISOString().split('T')[0]}.${format}`,
    filters: format === 'csv'
      ? [{ name: 'CSV', extensions: ['csv'] }]
      : [{ name: 'JSON', extensions: ['json'] }],
  });
  if (!filePath) return false;
  if (format === 'json') {
    fs.writeFileSync(filePath, JSON.stringify(logs, null, 2), 'utf-8');
  } else {
    const keys = Object.keys(logs[0] || {});
    const csv = [keys.join(','), ...logs.map(l => keys.map(k => JSON.stringify(l[k] ?? '')).join(','))].join('\n');
    fs.writeFileSync(filePath, csv, 'utf-8');
  }
  return true;
});

// ---- IPC: Chat History ----
ipcMain.handle('get-chat-history', async (_, sessionId) => getChatHistory(sessionId));
ipcMain.handle('save-chat-message', async (_, sessionId, role, content) => saveChatMessage(sessionId, role, content));
ipcMain.handle('clear-chat-session', async (_, sessionId) => clearChatSession(sessionId));
ipcMain.handle('get-recent-sessions', async () => getRecentSessions());

// ---- IPC: Daily Summary ----
ipcMain.handle('get-daily-summary', async (_, date) => getDailySummary(date));
ipcMain.handle('save-daily-summary', async (_, date, summary) => saveDailySummary(date, summary));

// ---- IPC: Settings ----
ipcMain.handle('get-settings', async () => getSettings());
ipcMain.handle('update-setting', async (_, key: string, value: string) => updateSetting(key, value));

// ---- IPC: Permissions ----
ipcMain.handle('request-accessibility', async () => {
  if (process.platform === 'darwin') {
    // Calling with `true` forces the macOS prompt to appear if not granted
    return systemPreferences.isTrustedAccessibilityClient(true);
  }
  return true;
});

ipcMain.handle('request-input-monitoring', async () => {
  if (process.platform === 'darwin') {
    try {
      // Bumping the uiohook start briefly is the only way to trigger
      // the Input Monitoring prompt on macOS from Node.js
      const { uIOhook } = await import('uiohook-napi');
      uIOhook.start();
      setTimeout(() => uIOhook.stop(), 100);
    } catch { /* ignore */ }
  }
});
