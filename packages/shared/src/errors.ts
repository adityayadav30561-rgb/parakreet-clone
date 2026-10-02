/** Every error the UI can show has a stable code so it can be searched in logs and docs. */
export const ERROR_CODES = [
  'IPC_INVALID_REQUEST',
  'IPC_UNTRUSTED_SENDER',
  'SETTINGS_ENCRYPTION_UNAVAILABLE',
  'SETTINGS_READ_FAILED',
  'SETTINGS_WRITE_FAILED',
  'DIAGNOSTICS_EXPORT_FAILED',
  'UNEXPECTED',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface AppError {
  readonly code: ErrorCode;
  /** Short, user-facing explanation. Never contains secrets. */
  readonly message: string;
  /** Optional technical detail (already redacted). */
  readonly detail?: string;
  /** True when the user can retry or fix the problem from the UI. */
  readonly recoverable: boolean;
  /** ISO-8601 timestamp. */
  readonly timestamp: string;
}

export function createAppError(
  code: ErrorCode,
  message: string,
  options: { detail?: string; recoverable?: boolean; now?: Date } = {},
): AppError {
  const error: AppError = {
    code,
    message,
    recoverable: options.recoverable ?? true,
    timestamp: (options.now ?? new Date()).toISOString(),
  };
  return options.detail === undefined ? error : { ...error, detail: options.detail };
}

/** Result wrapper used by every IPC call, so failures reach the UI instead of being thrown away. */
export type IpcResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: AppError };
