/**
 * detect-key.ts
 * Centralized AI API key detection using strict regex patterns.
 * Add new providers here  never use startsWith() elsewhere in the codebase.
 */

export type AIProvider =
  | "groq"
  | "gemini"
  | "openai"
  | "anthropic"
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
// Each pattern is tested against the raw key string.
const KEY_PATTERNS: Array<{ provider: AIProvider; label: string; regex: RegExp }> = [
  // Groq:  gsk_<50+ alphanumeric>
  {
    provider: "groq",
    label: "Groq",
    regex: /^gsk_[A-Za-z0-9]{40,}$/,
  },
  // Gemini / Google AI Studio:  AIza<35+ base64url>
  // Must come BEFORE the generic "AI" check
  {
    provider: "gemini",
    label: "Gemini",
    regex: /^AIza[A-Za-z0-9_-]{35,}$/,
  },
  // OpenAI project key:  sk-proj-<48+ base64url>
  {
    provider: "openai",
    label: "OpenAI",
    regex: /^sk-proj-[A-Za-z0-9_-]{40,}$/,
  },
  // OpenAI legacy:  sk-<48 alphanumeric>
  {
    provider: "openai",
    label: "OpenAI",
    regex: /^sk-[A-Za-z0-9]{32,}$/,
  },
  // Anthropic:  sk-ant-<48+ base64url>
  {
    provider: "anthropic",
    label: "Anthropic",
    regex: /^sk-ant-[A-Za-z0-9_-]{32,}$/,
  },
  // Cohere:  random 40-char alphanumeric (no prefix)  detected by elimination + length
  // We match the exact documented format
  {
    provider: "cohere",
    label: "Cohere",
    regex: /^[A-Za-z0-9]{40}$/,
  },
  // Mistral: random 32-char alphanumeric
  {
    provider: "mistral",
    label: "Mistral",
    regex: /^[A-Za-z0-9]{32}$/,
  },
  // HuggingFace:  hf_<alphanumeric>
  {
    provider: "huggingface",
    label: "HuggingFace",
    regex: /^hf_[A-Za-z0-9]{30,}$/,
  },
]

// JWT pattern (Bearer / Auth0 / Firebase custom tokens)
// Format: base64url.base64url.base64url
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

  // Try every known pattern
  for (const { provider, label, regex } of KEY_PATTERNS) {
    if (regex.test(trimmed)) {
      return { provider, label, isValid: true }
    }
  }

  // JWT / Bearer token  treat as unknown but structurally valid
  if (JWT_REGEX.test(trimmed)) {
    return { provider: "unknown", label: "JWT Token", isValid: true }
  }

  // Generic long key  valid format but unknown provider
  if (GENERIC_LONG_KEY_REGEX.test(trimmed)) {
    return { provider: "unknown", label: "API Key", isValid: true }
  }

  return { provider: "unknown", label: "Unknown", isValid: false }
}

/**
 * Returns true if the key should be routed to the Gemini API.
 * More robust than `key.startsWith("AI")`.
 */
export function isGeminiKey(key: string): boolean {
  return detectApiKey(key).provider === "gemini"
}

/**
 * Returns true if the key should be routed to the Groq API.
 */
export function isGroqKey(key: string): boolean {
  return detectApiKey(key).provider === "groq"
}

/**
 * Returns true if the key should be routed to the OpenAI API.
 */
export function isOpenAIKey(key: string): boolean {
  return detectApiKey(key).provider === "openai"
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
 * Never expose the key itself  only the provider name.
 */
export function getKeyProviderLabel(key: string | null | undefined): string {
  if (!key) return "No key set"
  const { label, isValid } = detectApiKey(key)
  if (!isValid) return "Key set (unrecognised format)"
  return `${label} key configured`
}
