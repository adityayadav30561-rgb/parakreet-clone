import { describe, expect, it } from 'vitest';
import { REDACTED, redact, redactString } from '../src/logging/redact';

describe('redactString', () => {
  it.each([
    ['openai', 'key sk-proj-abcdefghijklmnop1234 used'],
    ['groq', 'gsk_ABCDEFGHIJ1234567890'],
    ['google', 'AIzaSyA1234567890abcdefghijklmnopqrs'],
    ['bearer', 'Authorization: Bearer abc.def.ghijklmnop'],
    ['hex', 'deadbeefdeadbeefdeadbeefdeadbeef'],
  ])('removes %s style secrets', (_name, input) => {
    const output = redactString(input);
    expect(output).toContain(REDACTED);
    expect(output).not.toMatch(/sk-proj|gsk_A|AIzaSy|abc\.def|deadbeefdeadbeef/);
  });

  it('leaves ordinary text alone', () => {
    expect(redactString('Microphone connected at 48000 Hz')).toBe('Microphone connected at 48000 Hz');
  });
});

describe('redact', () => {
  it('replaces values of secret-named keys at any depth', () => {
    const output = redact({ provider: 'groq', nested: { apiKey: 'short', list: [{ token: 'x' }] } });
    expect(output).toEqual({ provider: 'groq', nested: { apiKey: REDACTED, list: [{ token: REDACTED }] } });
  });

  it('handles cycles and errors without throwing', () => {
    const cyclic: Record<string, unknown> = { name: 'loop' };
    cyclic.self = cyclic;
    expect(redact(cyclic)).toEqual({ name: 'loop', self: '[Truncated]' });
    expect(redact(new Error('failed with sk-abcdefghijklmnop'))).toEqual({
      name: 'Error',
      message: `failed with ${REDACTED}`,
    });
  });
});
