import { app, BrowserWindow, Menu, session, type WebContents } from 'electron';
import { EVENT_CHANNELS } from '@ria/shared';
import { SettingsStore } from '../settings/store';
import { registerIpcHandlers } from './ipc';
import { logger } from './logger';
import { StatusManager } from './status';
import { createMainWindow } from './window';

// A single strict CSP for the renderer: our own assets, no remote code, connect only over HTTPS/WSS.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https: wss:",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join('; ');

function applyCsp(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [CSP] } });
  });
  // Deny every permission request (camera, geolocation, etc.) by default in Stage 0.
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, done) => done(false));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  const trusted = new Set<WebContents>();
  const status = new StatusManager();
  let settings: SettingsStore;

  void app.whenReady().then(() => {
    applyCsp();
    Menu.setApplicationMenu(null);
    settings = new SettingsStore();

    registerIpcHandlers({
      settings,
      status,
      isTrustedSender: (contents) => trusted.has(contents),
    });

    const open = (): void => {
      const window = createMainWindow();
      trusted.add(window.webContents);
      window.webContents.on('destroyed', () => trusted.delete(window.webContents));
      const unsubscribe = status.subscribe((snapshot) => {
        if (!window.isDestroyed()) window.webContents.send(EVENT_CHANNELS.statusChanged, snapshot);
      });
      window.on('closed', unsubscribe);
    };

    open();
    logger.info('app', 'Application ready', { packaged: app.isPackaged });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) open();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  // Defence in depth: forbid opening new windows and navigation from any web contents.
  app.on('web-contents-created', (_event, contents) => {
    contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  });
}
