import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import {
  EVENT_CHANNELS,
  INVOKE_CHANNELS,
  type AppError,
  type RiaApi,
  type StatusSnapshot,
  type Unsubscribe,
} from '@ria/shared';

function invoke<T>(channel: string, payload?: unknown): Promise<T> {
  return ipcRenderer.invoke(channel, payload) as Promise<T>;
}

function subscribe<T>(channel: string, listener: (value: T) => void): Unsubscribe {
  const handler = (_event: IpcRendererEvent, value: T): void => listener(value);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

const api: RiaApi = {
  ping: (request) => invoke(INVOKE_CHANNELS.ping, request),
  getAppInfo: () => invoke(INVOKE_CHANNELS.getAppInfo),
  getStatus: () => invoke(INVOKE_CHANNELS.getStatus),
  getSettings: () => invoke(INVOKE_CHANNELS.getSettings),
  setApiKey: (request) => invoke(INVOKE_CHANNELS.setApiKey, request),
  clearApiKey: (request) => invoke(INVOKE_CHANNELS.clearApiKey, request),
  getDiagnostics: () => invoke(INVOKE_CHANNELS.getDiagnostics),
  saveDiagnostics: () => invoke(INVOKE_CHANNELS.saveDiagnostics),
  onStatusChanged: (listener: (status: StatusSnapshot) => void) => subscribe(EVENT_CHANNELS.statusChanged, listener),
  onError: (listener: (error: AppError) => void) => subscribe(EVENT_CHANNELS.error, listener),
};

contextBridge.exposeInMainWorld('ria', api);
