import { writeFile } from 'node:fs/promises';
import { dialog, ipcMain, type IpcMainInvokeEvent, type WebContents } from 'electron';
import {
  INVOKE_CHANNELS,
  clearApiKeyRequestSchema,
  createAppError,
  pingRequestSchema,
  setApiKeyRequestSchema,
  type AppError,
  type DiagnosticsReport,
  type DiagnosticsSaveResult,
  type IpcResult,
} from '@ria/shared';
import type { ZodType } from 'zod';
import { buildAppInfo, buildDiagnostics } from '../diagnostics/report';
import type { SettingsStore } from '../settings/store';
import type { StatusManager } from './status';
import { recentErrors, recordError } from './errors';
import { logger } from './logger';

export interface IpcDeps {
  readonly settings: SettingsStore;
  readonly status: StatusManager;
  /** Returns true if the event came from a WebContents we created and trust. */
  readonly isTrustedSender: (contents: WebContents) => boolean;
}

function fail(code: AppError['code'], message: string, detail?: string): IpcResult<never> {
  const error = createAppError(code, message, detail === undefined ? {} : { detail });
  recordError(error);
  return { ok: false, error };
}

/** Wraps a handler with sender-trust and zod validation so every request is checked in main. */
function handle<TReq, TRes>(
  channel: string,
  deps: IpcDeps,
  schema: ZodType<TReq> | null,
  run: (request: TReq, event: IpcMainInvokeEvent) => Promise<IpcResult<TRes>> | IpcResult<TRes>,
): void {
  ipcMain.handle(channel, async (event, raw: unknown): Promise<IpcResult<TRes>> => {
    if (!deps.isTrustedSender(event.sender)) {
      logger.warn('ipc', 'Rejected untrusted sender', { channel });
      return fail('IPC_UNTRUSTED_SENDER', 'Request rejected: untrusted sender.');
    }
    let request: TReq;
    if (schema) {
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        logger.warn('ipc', 'Rejected invalid request', { channel, issues: parsed.error.issues.length });
        return fail('IPC_INVALID_REQUEST', 'Request rejected: invalid arguments.');
      }
      request = parsed.data;
    } else {
      request = undefined as TReq;
    }
    try {
      return await run(request, event);
    } catch (error) {
      logger.error('ipc', 'Handler threw', { channel, error });
      return fail('UNEXPECTED', 'Something went wrong handling the request.');
    }
  });
}

export function registerIpcHandlers(deps: IpcDeps): void {
  handle(INVOKE_CHANNELS.ping, deps, pingRequestSchema, (request) => ({
    ok: true,
    value: { nonce: request.nonce, receivedAt: new Date().toISOString() },
  }));

  handle(INVOKE_CHANNELS.getAppInfo, deps, null, () => ({ ok: true, value: buildAppInfo() }));

  handle(INVOKE_CHANNELS.getStatus, deps, null, () => ({ ok: true, value: deps.status.get() }));

  handle(INVOKE_CHANNELS.getSettings, deps, null, () => ({ ok: true, value: deps.settings.view() }));

  handle(INVOKE_CHANNELS.setApiKey, deps, setApiKeyRequestSchema, (request) =>
    deps.settings.setKey(request.provider, request.apiKey),
  );

  handle(INVOKE_CHANNELS.clearApiKey, deps, clearApiKeyRequestSchema, (request) =>
    deps.settings.clearKey(request.provider),
  );

  handle(INVOKE_CHANNELS.getDiagnostics, deps, null, () => ({
    ok: true,
    value: buildDiagnostics(deps.status.get(), deps.settings.view(), recentErrors()),
  }));

  handle<undefined, DiagnosticsSaveResult>(INVOKE_CHANNELS.saveDiagnostics, deps, null, async () => {
    const report: DiagnosticsReport = buildDiagnostics(deps.status.get(), deps.settings.view(), recentErrors());
    const result = await dialog.showSaveDialog({
      title: 'Export Diagnostics',
      defaultPath: `diagnostics-${Date.now()}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath) return { ok: true, value: { saved: false } };
    try {
      await writeFile(result.filePath, JSON.stringify(report, null, 2), 'utf8');
      logger.info('diagnostics', 'Exported diagnostics', { filePath: result.filePath });
      return { ok: true, value: { saved: true, filePath: result.filePath } };
    } catch (error) {
      logger.error('diagnostics', 'Export failed', { error });
      return fail('DIAGNOSTICS_EXPORT_FAILED', 'Could not write the diagnostics file.');
    }
  });
}
