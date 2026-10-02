import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppInfo, IpcResult, StatusSnapshot } from '@ria/shared';

/** Narrow helper: unwrap an IpcResult or return undefined, surfacing errors to the console. */
async function unwrap<T>(promise: Promise<IpcResult<T>>): Promise<T | undefined> {
  const result = await promise;
  if (result.ok) return result.value;
  console.error('IPC error', result.error);
  return undefined;
}

export function useAppInfo(): AppInfo | undefined {
  const [info, setInfo] = useState<AppInfo>();
  useEffect(() => {
    void unwrap(window.ria.getAppInfo()).then(setInfo);
  }, []);
  return info;
}

export function useStatus(): StatusSnapshot {
  const [status, setStatus] = useState<StatusSnapshot>({
    microphone: 'not-connected',
    systemAudio: 'not-connected',
    ai: 'not-connected',
  });
  useEffect(() => {
    void unwrap(window.ria.getStatus()).then((value) => value && setStatus(value));
    return window.ria.onStatusChanged(setStatus);
  }, []);
  return status;
}

export interface PingState {
  readonly lastRoundTripMs: number | null;
  readonly ping: () => void;
}

/** Proves the renderer↔main IPC round-trip works, shown on the dashboard and used in e2e tests. */
export function usePing(): PingState {
  const [lastRoundTripMs, setLast] = useState<number | null>(null);
  const counter = useRef(0);
  const ping = useCallback(() => {
    const nonce = `r${(counter.current += 1)}-${Date.now()}`;
    const started = performance.now();
    void unwrap(window.ria.ping({ nonce })).then((value) => {
      if (value?.nonce === nonce) setLast(Math.round(performance.now() - started));
    });
  }, []);
  return { lastRoundTripMs, ping };
}
