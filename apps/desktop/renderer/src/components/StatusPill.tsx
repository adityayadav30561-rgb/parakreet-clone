import type { ConnectionState } from '@ria/shared';

const STYLES: Record<ConnectionState, { dot: string; label: string }> = {
  'not-connected': { dot: 'bg-slate-500', label: 'Not connected' },
  connecting: { dot: 'bg-amber-400 animate-pulse', label: 'Connecting' },
  connected: { dot: 'bg-emerald-400', label: 'Connected' },
  error: { dot: 'bg-red-500', label: 'Error' },
  unavailable: { dot: 'bg-slate-600', label: 'Unavailable' },
};

export function StatusPill({ label, state }: { label: string; state: ConnectionState }): React.JSX.Element {
  const style = STYLES[state];
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
      <span className="text-sm text-slate-300">{label}</span>
      <span className="flex items-center gap-2 text-sm">
        <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} aria-hidden />
        <span className="text-slate-400">{style.label}</span>
      </span>
    </div>
  );
}
