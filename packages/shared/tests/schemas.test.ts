import { describe, expect, it } from 'vitest';
import { IPC_LIMITS, setApiKeyRequestSchema, pingRequestSchema } from '../src/ipc/schemas';

describe('IPC request schemas', () => {
  it('accepts a valid API key request and trims whitespace', () => {
    const parsed = setApiKeyRequestSchema.parse({ provider: 'groq', apiKey: '  gsk_1234567890  ' });
    expect(parsed).toEqual({ provider: 'groq', apiKey: 'gsk_1234567890' });
  });

  it.each([
    ['unknown provider', { provider: 'evil', apiKey: 'gsk_1234567890' }],
    ['too short', { provider: 'groq', apiKey: 'abc' }],
    ['too long', { provider: 'groq', apiKey: 'a'.repeat(IPC_LIMITS.apiKeyMaxLength + 1) }],
    ['inner space', { provider: 'groq', apiKey: 'gsk_123 4567890' }],
    ['wrong type', { provider: 'groq', apiKey: 42 }],
    ['missing field', { provider: 'groq' }],
  ])('rejects %s', (_name, input) => {
    expect(setApiKeyRequestSchema.safeParse(input).success).toBe(false);
  });

  it('bounds the ping nonce', () => {
    expect(pingRequestSchema.safeParse({ nonce: 'abc' }).success).toBe(true);
    expect(pingRequestSchema.safeParse({ nonce: '' }).success).toBe(false);
    expect(pingRequestSchema.safeParse({ nonce: 'x'.repeat(IPC_LIMITS.pingNonceMaxLength + 1) }).success).toBe(false);
  });
});
