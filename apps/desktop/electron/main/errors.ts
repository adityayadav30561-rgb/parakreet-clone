import type { AppError } from '@ria/shared';

const MAX = 50;
const ring: AppError[] = [];

export function recordError(error: AppError): void {
  ring.push(error);
  if (ring.length > MAX) ring.shift();
}

export function recentErrors(): readonly AppError[] {
  return ring.map((error) => ({ ...error }));
}
