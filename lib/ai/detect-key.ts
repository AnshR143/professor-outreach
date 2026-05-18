/**
 * detect-key.ts
 * Centralized AI API key detection using strict regex patterns.
 * Add new providers here — never use startsWith() elsewhere in the codebase.
 */

export type AIProvider =
  | "groq"
  | "gemini"
  | "openai"
  | "anthropic"
  | "openrouter"
  | "perplexity"
  | "cerebras"
  | "xai"
  | "fireworks"
  | "together"
  | "cohere"
  | "mistral"
  | "huggingface"
  | "unknown"

export interface DetectedKey {
  provider: AIProvider
  label: string       // human-readable name for UI display
  isValid: boolean    // true if the key matches a known format
}

// ─── Regex patterns for each provider ────────────────────────────────────────
// ORDER MATTERS — more specific prefixes must come before generic ones.
const KEY_PATTERNS: Array<{ provider: AIProvider; label: string; regex: RegExp }> = [
  // Groq: gsk_<50+ alphanumeric>
  { provider: "groq",       label: "Groq",        regex: /^gsk_[A-Za-z0-9]{40,}$/ },

  // Gemini / Google AI Studio: AIza<35+ base64url>
  { provider: "gemini",     label: "Gemini",       regex: /^AIza[A-Za-z0-9_-]{35,}$/ },

  // Anthropic: sk-ant-<32+ base64url>
  { provider: "anthropic",  label: "Anthropic",    regex: /^sk-ant-[A-Za-z0-9_-]{32,}$/ },

  // OpenRouter: sk-or-<40+ base64url>  (MUST come before generic sk-proj- / sk-)
  { provider: "openrouter", label: "OpenRouter",   regex: /^sk-or-[A-Za-z0-9_-]{40,}$/ },

  // OpenAI project key: sk-proj-<48+ base64url>  (MUST come before generic sk-)
  { provider: "openai",     label: "OpenAI",       regex: /^sk-proj-[A-Za-z0-9_-]{40,}$/ },

  // OpenAI legacy: sk-<32+ alphanumeric>
  { provider: "openai",     label: "OpenAI",       regex: /^sk-[A-Za-z0-9]{32,}$/ },

  // Perplexity: pplx-<40+ alphanumeric>
  { provider: "perplexity", label: "Perplexity",   regex: /^pplx-[A-Za-z0-9]{40,}$/ },

  // Cerebras: csk-<40+ alphanumeric>
  { provider: "cerebras",   label: "Cerebras",     regex: /^csk-[A-Za-z0-9]{40,}$/ },

  // xAI (Grok): xai-<40+ base64url>
  { provider: "xai",        label: "xAI (Grok)",   regex: /^xai-[A-Za-z0-9_-]{40,}$/ },

  // Fireworks AI: fw-<40+ alphanumeric>
  { provider: "fireworks",  label: "Fireworks AI", regex: /^fw-[A-Za-z0-9]{40,}$/ },

  // Together AI: 64-char lowercase hex (must come before Cohere/Mistral generic checks)
  { provider: "together",   label: "Together AI",  regex: /^[a-f0-9]{64}$/ },

  // Cohere: random 40-char alphanumeric (no prefix)
  { provider: "cohere",     label: "Cohere",       regex: /^[A-Za-z0-9]{40}$/ },

  // Mistral: random 32-char alphanumeric
  { provider: "mistral",    label: "Mistral",      regex: /^[A-Za-z0-9]{32}$/ },

  // HuggingFace: hf_<alphanumeric>
  { provider: "huggingface", label: "HuggingFace", regex: /^hf_[A-Za-z0-9]{30,}$/ },
]

// JWT pattern (Bearer / Auth0 / Firebase custom tokens)
const JWT_REGEX = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

// Generic long key (anything 20–256 chars of safe characters that didn't match above)
const GENERIC_LONG_KEY_REGEX = /^[A-Za-z0-9_\-]{20,256}$/

/**
 * Detect which provider an API key belongs to and whether its format is valid.
 *
 * @example
 *   const { provider, label, isValid } = detectApiKey("gsk_abc123...")
 *   // → { provider: "groq", label: "Groq", isValid: true }
 */
export function detectApiKey(key: string): DetectedKey {
  const trimmed = key?.trim() ?? ""

  if (!trimmed) {
    return { provider: "unknown", label: "Unknown", isValid: false }
  }

  for (const { provider, label, regex } of KEY_PATTERNS) {
    if (regex.test(trimmed)) {
      return { provider, label, isValid: true }
    }
  }

  if (JWT_REGEX.test(trimmed)) {
    return { provider: "unknown", label: "JWT Token", isValid: true }
  }

  if (GENERIC_LONG_KEY_REGEX.test(trimmed)) {
    return { provider: "unknown", label: "API Key", isValid: true }
  }

  return { provider: "unknown", label: "Unknown", isValid: false }
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

export function isGeminiKey(key: string): boolean {
  return detectApiKey(key).provider === "gemini"
}

export function isGroqKey(key: string): boolean {
  return detectApiKey(key).provider === "groq"
}

export function isOpenAIKey(key: string): boolean {
  return detectApiKey(key).provider === "openai"
}

export function isAnthropicKey(key: string): boolean {
  return detectApiKey(key).provider === "anthropic"
}

/**
 * Pick the best available AI key from a priority list.
 * Returns the first non-empty key found.
 */
export function pickBestKey(...keys: (string | null | undefined)[]): string {
  return keys.find(k => k && k.trim().length > 0)?.trim() ?? ""
}

/**
 * Get a display label for a stored key (for Settings UI).
 * Never expose the key itself — only the provider name.
 */
export function getKeyProviderLabel(key: string | null | undefined): string {
  if (!key) return "No key set"
  const { label, isValid } = detectApiKey(key)
  if (!isValid) return "Key set (unrecognised format)"
  return `${label} key configured`
}
