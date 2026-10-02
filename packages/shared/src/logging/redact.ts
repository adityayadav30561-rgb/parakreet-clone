export const REDACTED = '[REDACTED]';

/** Object keys whose values are always secret, whatever they contain. */
const SECRET_KEY_PATTERN = /(api[-_]?key|apikey|token|secret|password|authorization|cookie)/i;

/**
 * Known API-key shapes, so a key pasted into a free-text message is still removed.
 * Covers OpenAI (sk-...), Groq (gsk_...), Google (AIza...), bearer tokens and long hex/base64 blobs.
 */
const SECRET_VALUE_PATTERNS: readonly RegExp[] = [
  /\bsk-[A-Za-z0-9_-]{8,}/g,
  /\bgsk_[A-Za-z0-9]{8,}/g,
  /\bcsk-[A-Za-z0-9]{8,}/g,
  /\bAIza[A-Za-z0-9_-]{20,}/g,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi,
  /\b[A-Fa-f0-9]{32,}\b/g,
];

const MAX_DEPTH = 8;

export function redactString(value: string): string {
  return SECRET_VALUE_PATTERNS.reduce((text, pattern) => text.replace(pattern, REDACTED), value);
}

/** Returns a deep copy with secret keys and secret-looking strings replaced. Safe on cycles. */
export function redact(value: unknown): unknown {
  return redactValue(value, 0, new WeakSet());
}

function redactValue(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (typeof value === 'string') return redactString(value);
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH || seen.has(value)) return '[Truncated]';
  seen.add(value);

  if (value instanceof Error) {
    return { name: value.name, message: redactString(value.message) };
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1, seen));
  }
  const result: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value)) {
    result[key] = SECRET_KEY_PATTERN.test(key) ? REDACTED : redactValue(inner, depth + 1, seen);
  }
  return result;
}
