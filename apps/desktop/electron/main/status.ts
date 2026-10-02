import type { StatusSnapshot } from '@ria/shared';

type Listener = (status: StatusSnapshot) => void;

/** Holds the current subsystem status. In Stage 0 everything is "not-connected". */
export class StatusManager {
  private status: StatusSnapshot = { microphone: 'not-connected', systemAudio: 'not-connected', ai: 'not-connected' };
  private readonly listeners = new Set<Listener>();

  get(): StatusSnapshot {
    return this.status;
  }

  update(patch: Partial<StatusSnapshot>): void {
    this.status = { ...this.status, ...patch };
    for (const listener of this.listeners) listener(this.status);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
