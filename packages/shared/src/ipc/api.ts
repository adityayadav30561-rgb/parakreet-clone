import type { AppError, IpcResult } from '../errors';
import type { SettingsView } from '../providers';
import type { AppInfo, StatusSnapshot } from '../status';
import type { ClearApiKeyRequest, PingRequest, SetApiKeyRequest } from './schemas';

export interface PingResponse {
  readonly nonce: string;
  readonly receivedAt: string;
}

export interface DiagnosticsReport {
  readonly generatedAt: string;
  readonly app: AppInfo;
  readonly status: StatusSnapshot;
  readonly settings: SettingsView;
  readonly recentErrors: readonly AppError[];
  readonly recentLogs: readonly LogEntry[];
}

export type DiagnosticsSaveResult = { readonly saved: true; readonly filePath: string } | { readonly saved: false };

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  readonly time: string;
  readonly level: LogLevel;
  readonly scope: string;
  readonly message: string;
  readonly data?: Readonly<Record<string, unknown>>;
}

export type Unsubscribe = () => void;

/**
 * The only API the renderer can reach, exposed by the preload script as `window.ria`.
 * Every request is validated again in main; this interface is a convenience, not a trust boundary.
 */
export interface RiaApi {
  ping(request: PingRequest): Promise<IpcResult<PingResponse>>;
  getAppInfo(): Promise<IpcResult<AppInfo>>;
  getStatus(): Promise<IpcResult<StatusSnapshot>>;
  getSettings(): Promise<IpcResult<SettingsView>>;
  setApiKey(request: SetApiKeyRequest): Promise<IpcResult<SettingsView>>;
  clearApiKey(request: ClearApiKeyRequest): Promise<IpcResult<SettingsView>>;
  getDiagnostics(): Promise<IpcResult<DiagnosticsReport>>;
  saveDiagnostics(): Promise<IpcResult<DiagnosticsSaveResult>>;
  onStatusChanged(listener: (status: StatusSnapshot) => void): Unsubscribe;
  onError(listener: (error: AppError) => void): Unsubscribe;
}
