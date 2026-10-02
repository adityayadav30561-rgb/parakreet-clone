import { useEffect, useState } from 'react';
import { useAppInfo, usePing, useStatus } from './useRia';
import { Panel } from './components/Panel';
import { StatusPill } from './components/StatusPill';

function Placeholder({ text }: { text: string }): React.JSX.Element {
  return <p className="text-sm text-slate-500 italic">{text}</p>;
}

export function App(): React.JSX.Element {
  const info = useAppInfo();
  const status = useStatus();
  const { lastRoundTripMs, ping } = usePing();
  // Self-check shown in the UI: the renderer must not be able to reach Node. Computed once at render.
  const [nodeLeak] = useState<boolean>(() => {
    const w = window as unknown as Record<string, unknown>;
    return typeof w['require'] !== 'undefined' || typeof w['process'] !== 'undefined';
  });

  useEffect(() => {
    ping();
  }, [ping]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Realtime Interview Assistant</h1>
        <p className="mt-1 text-sm text-slate-400">
          Research build · Stage 0 foundation ·{' '}
          {info ? `v${info.appVersion} · Electron ${info.electronVersion} · ${info.platform}/${info.arch}` : 'loading…'}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Status">
          <div className="space-y-2">
            <StatusPill label="Microphone" state={status.microphone} />
            <StatusPill label="System audio" state={status.systemAudio} />
            <StatusPill label="AI connection" state={status.ai} />
          </div>
        </Panel>

        <Panel title="Health" hint="Stage 0 self-checks">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">IPC round-trip</dt>
              <dd className="text-slate-200">{lastRoundTripMs === null ? '—' : `${lastRoundTripMs} ms`}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Renderer Node access</dt>
              <dd className={nodeLeak ? 'text-red-400' : 'text-emerald-400'}>
                {nodeLeak ? 'LEAK — exposed' : 'blocked (good)'}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={ping}
            className="mt-4 rounded-md bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600"
          >
            Re-test IPC
          </button>
        </Panel>

        <Panel title="Transcript">
          <Placeholder text="Live transcript appears here once audio capture lands (Stage 1–2)." />
        </Panel>
        <Panel title="Current question">
          <Placeholder text="Detected interviewer question appears here (Stage 3)." />
        </Panel>
        <Panel title="Suggested answer">
          <Placeholder text="Streamed answer appears here (Stage 3)." />
        </Panel>
        <Panel title="Latency" hint="end-to-end">
          <Placeholder text="Per-stage latency breakdown appears here (Stage 3)." />
        </Panel>
      </div>

      <p className="mt-8 text-xs text-slate-600">
        Export a diagnostics file from the tray/menu to share with the team. API keys are never included.
      </p>
    </div>
  );
}
