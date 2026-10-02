import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { app, safeStorage } from 'electron';
import {
  PROVIDER_IDS,
  createAppError,
  type ApiKeyPresence,
  type IpcResult,
  type ProviderId,
  type SettingsView,
} from '@ria/shared';
import { logger } from '../main/logger';

interface StoredKeys {
  /** provider -> base64 of OS-encrypted key bytes. */
  readonly keys: Partial<Record<ProviderId, string>>;
}

/**
 * Stores API keys encrypted at rest via Electron safeStorage (Windows DPAPI).
 * Decrypted keys never leave main and are never sent to the renderer.
 */
export class SettingsStore {
  private readonly file: string;
  private cache: StoredKeys = { keys: {} };

  constructor(file = join(app.getPath('userData'), 'settings', 'keys.json')) {
    this.file = file;
    this.load();
  }

  private load(): void {
    try {
      if (existsSync(this.file)) {
        const parsed = JSON.parse(readFileSync(this.file, 'utf8')) as Partial<StoredKeys>;
        if (parsed && typeof parsed === 'object' && parsed.keys) this.cache = { keys: parsed.keys };
      }
    } catch (error) {
      logger.error('settings', 'Failed to read key store; starting empty', { error });
      this.cache = { keys: {} };
    }
  }

  private persist(): void {
    mkdirSync(dirname(this.file), { recursive: true });
    writeFileSync(this.file, JSON.stringify(this.cache), { mode: 0o600 });
  }

  encryptionAvailable(): boolean {
    try {
      return safeStorage.isEncryptionAvailable();
    } catch {
      return false;
    }
  }

  private presence(): ApiKeyPresence {
    return Object.fromEntries(PROVIDER_IDS.map((id) => [id, Boolean(this.cache.keys[id])])) as ApiKeyPresence;
  }

  view(): SettingsView {
    return { apiKeys: this.presence(), encryptionAvailable: this.encryptionAvailable() };
  }

  setKey(provider: ProviderId, apiKey: string): IpcResult<SettingsView> {
    if (!this.encryptionAvailable()) {
      return {
        ok: false,
        error: createAppError(
          'SETTINGS_ENCRYPTION_UNAVAILABLE',
          'This system cannot securely encrypt API keys, so none can be saved.',
          { recoverable: false },
        ),
      };
    }
    try {
      const encrypted = safeStorage.encryptString(apiKey).toString('base64');
      this.cache = { keys: { ...this.cache.keys, [provider]: encrypted } };
      this.persist();
      logger.info('settings', 'Stored API key', { provider });
      return { ok: true, value: this.view() };
    } catch (error) {
      logger.error('settings', 'Failed to store API key', { provider, error });
      return { ok: false, error: createAppError('SETTINGS_WRITE_FAILED', 'Could not save the API key.') };
    }
  }

  clearKey(provider: ProviderId): IpcResult<SettingsView> {
    const { [provider]: _removed, ...rest } = this.cache.keys;
    this.cache = { keys: rest };
    try {
      this.persist();
      logger.info('settings', 'Cleared API key', { provider });
      return { ok: true, value: this.view() };
    } catch (error) {
      logger.error('settings', 'Failed to clear API key', { provider, error });
      return { ok: false, error: createAppError('SETTINGS_WRITE_FAILED', 'Could not update stored keys.') };
    }
  }

  /** Decrypt a key for use inside main only. Returns undefined when absent or undecryptable. */
  revealKey(provider: ProviderId): string | undefined {
    const encrypted = this.cache.keys[provider];
    if (!encrypted || !this.encryptionAvailable()) return undefined;
    try {
      return safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
    } catch (error) {
      logger.error('settings', 'Failed to decrypt key', { provider, error });
      return undefined;
    }
  }
}
