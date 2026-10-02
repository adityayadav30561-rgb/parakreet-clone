import { z } from 'zod';
import { PROVIDER_IDS } from '../providers';

/** Upper bounds keep a misbehaving renderer from pushing huge payloads into main. */
export const IPC_LIMITS = {
  pingNonceMaxLength: 64,
  apiKeyMinLength: 8,
  apiKeyMaxLength: 512,
} as const;

export const pingRequestSchema = z.object({
  nonce: z.string().min(1).max(IPC_LIMITS.pingNonceMaxLength),
});

export const providerIdSchema = z.enum(PROVIDER_IDS);

export const setApiKeyRequestSchema = z.object({
  provider: providerIdSchema,
  apiKey: z
    .string()
    .trim()
    .min(IPC_LIMITS.apiKeyMinLength)
    .max(IPC_LIMITS.apiKeyMaxLength)
    .regex(/^\S+$/, 'API key must not contain spaces'),
});

export const clearApiKeyRequestSchema = z.object({
  provider: providerIdSchema,
});

export type PingRequest = z.infer<typeof pingRequestSchema>;
export type SetApiKeyRequest = z.infer<typeof setApiKeyRequestSchema>;
export type ClearApiKeyRequest = z.infer<typeof clearApiKeyRequestSchema>;
