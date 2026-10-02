import { app } from 'electron';
import { release, arch, platform } from 'node:os';
import type { AppError, AppInfo, DiagnosticsReport, SettingsView, StatusSnapshot } from '@ria/shared';
import { logger } from '../main/logger';

export function buildAppInfo(): AppInfo {
  return {
    appName: app.getName(),
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron ?? 'unknown',
    chromeVersion: process.versions.chrome ?? 'unknown',
    nodeVersion: process.versions.node ?? 'unknown',
    platform: platform(),
    arch: arch(),
    osRelease: release(),
    isPackaged: app.isPackaged,
  };
}

export function buildDiagnostics(
  status: StatusSnapshot,
  settings: SettingsView,
  recentErrors: readonly AppError[],
): DiagnosticsReport {
  return {
    generatedAt: new Date().toISOString(),
    app: buildAppInfo(),
    status,
    settings,
    recentErrors,
    recentLogs: logger.snapshot(),
  };
}
