/** Connection state of one subsystem, as shown in the status panel. */
export const CONNECTION_STATES = ['not-connected', 'connecting', 'connected', 'error', 'unavailable'] as const;

export type ConnectionState = (typeof CONNECTION_STATES)[number];

export interface StatusSnapshot {
  readonly microphone: ConnectionState;
  readonly systemAudio: ConnectionState;
  readonly ai: ConnectionState;
}

export interface AppInfo {
  readonly appName: string;
  readonly appVersion: string;
  readonly electronVersion: string;
  readonly chromeVersion: string;
  readonly nodeVersion: string;
  readonly platform: string;
  readonly arch: string;
  readonly osRelease: string;
  readonly isPackaged: boolean;
}
