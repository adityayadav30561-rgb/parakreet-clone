import type { RiaApi } from '@ria/shared';

declare global {
  interface Window {
    readonly ria: RiaApi;
  }
}

export {};
