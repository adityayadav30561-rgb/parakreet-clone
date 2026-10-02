import { join } from 'node:path';
import { BrowserWindow, shell } from 'electron';

const DEV_SERVER = process.env['ELECTRON_RENDERER_URL'];

/** Creates the main window with the locked-down renderer baseline (Stage 0, security). */
export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 820,
    minHeight: 560,
    show: false,
    backgroundColor: '#0b0f17',
    title: 'Realtime Interview Assistant',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      spellcheck: false,
    },
  });

  window.once('ready-to-show', () => window.show());

  // External links open in the user's browser, never inside the app.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });

  // Block in-app navigation away from our own content.
  window.webContents.on('will-navigate', (event, url) => {
    const isDev = Boolean(DEV_SERVER) && url.startsWith(DEV_SERVER as string);
    if (!isDev) event.preventDefault();
  });

  if (DEV_SERVER) {
    void window.loadURL(DEV_SERVER);
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
}
