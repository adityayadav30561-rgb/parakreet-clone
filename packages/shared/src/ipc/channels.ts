/** Renderer → main request/response channels (ipcRenderer.invoke / ipcMain.handle). */
export const INVOKE_CHANNELS = {
  ping: 'app:ping',
  getAppInfo: 'app:get-info',
  getStatus: 'app:get-status',
  getSettings: 'settings:get',
  setApiKey: 'settings:set-api-key',
  clearApiKey: 'settings:clear-api-key',
  getDiagnostics: 'diagnostics:get-report',
  saveDiagnostics: 'diagnostics:save-report',
} as const;

/** Main → renderer push channels (webContents.send / ipcRenderer.on). */
export const EVENT_CHANNELS = {
  statusChanged: 'app:status-changed',
  error: 'app:error',
} as const;

export type InvokeChannel = (typeof INVOKE_CHANNELS)[keyof typeof INVOKE_CHANNELS];
export type EventChannel = (typeof EVENT_CHANNELS)[keyof typeof EVENT_CHANNELS];
