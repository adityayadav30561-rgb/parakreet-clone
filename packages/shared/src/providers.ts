/** AI providers whose API keys can be stored in Settings (see docs/ROADMAP.md, "AI providers"). */
export const PROVIDER_IDS = ['groq', 'gemini', 'openai', 'assemblyai', 'deepgram', 'cerebras'] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

export const PROVIDER_LABELS: Readonly<Record<ProviderId, string>> = {
  groq: 'Groq',
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  assemblyai: 'AssemblyAI',
  deepgram: 'Deepgram',
  cerebras: 'Cerebras',
};

/** What the renderer is allowed to know about stored keys: only whether one exists. */
export type ApiKeyPresence = Readonly<Record<ProviderId, boolean>>;

export interface SettingsView {
  readonly apiKeys: ApiKeyPresence;
  /** False when the OS cannot encrypt secrets; keys then cannot be saved. */
  readonly encryptionAvailable: boolean;
}
