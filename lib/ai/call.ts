/**
 * call.ts
 * Universal AI caller — routes to the correct provider based on the key prefix.
 * All API routes should import callAI from here instead of maintaining
 * their own Groq/Gemini branches.
 */

import { detectApiKey } from "./detect-key"

export interface AICallOptions {
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
  /** Request JSON output. Adds response_format for providers that support it. */
  jsonMode?: boolean
}

// ─── Provider configs ─────────────────────────────────────────────────────────

interface ProviderConfig {
  baseUrl: string
  model: string
  supportsJsonMode: boolean
  extraHeaders?: Record<string, string>
}

const PROVIDER_CONFIGS: Partial<Record<string, ProviderConfig>> = {
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    supportsJsonMode: true,
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    supportsJsonMode: true,
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    supportsJsonMode: true,
    extraHeaders: {
      "HTTP-Referer": "https://www.internlink.net",
      "X-Title": "InternLink",
    },
  },
  perplexity: {
    baseUrl: "https://api.perplexity.ai",
    model: "llama-3.1-sonar-large-128k-chat",
    supportsJsonMode: false,
  },
  cerebras: {
    baseUrl: "https://api.cerebras.ai/v1",
    model: "llama-3.3-70b",
    supportsJsonMode: true,
  },
  xai: {
    baseUrl: "https://api.x.ai/v1",
    model: "grok-3-mini",
    supportsJsonMode: false,
  },
  fireworks: {
    baseUrl: "https://api.fireworks.ai/inference/v1",
    model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
    supportsJsonMode: true,
  },
  together: {
    baseUrl: "https://api.together.xyz/v1",
    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    supportsJsonMode: true,
  },
  // Mistral uses OpenAI-compatible format
  mistral: {
    baseUrl: "https://api.mistral.ai/v1",
    model: "mistral-small-latest",
    supportsJsonMode: true,
  },
  // HuggingFace inference API
  huggingface: {
    baseUrl: "https://api-inference.huggingface.co/v1",
    model: "meta-llama/Llama-3.3-70B-Instruct",
    supportsJsonMode: false,
  },
}

// ─── OpenAI-compatible caller ─────────────────────────────────────────────────

async function callOpenAICompat(
  config: ProviderConfig,
  apiKey: string,
  messages: { role: string; content: string }[],
  options: AICallOptions,
): Promise<string> {
  const { maxTokens = 1500, temperature = 0.4, jsonMode = false } = options

  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature,
    max_tokens: maxTokens,
  }
  if (jsonMode && config.supportsJsonMode) {
    body.response_format = { type: "json_object" }
  }

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      ...(config.extraHeaders ?? {}),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`${config.model} error ${res.status}: ${err.slice(0, 300)}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ""
}

// ─── Gemini caller ────────────────────────────────────────────────────────────

async function callGemini(
  apiKey: string,
  messages: { role: string; content: string }[],
  options: AICallOptions,
): Promise<string> {
  const { maxTokens = 1500, temperature = 0.4, jsonMode = false } = options
  const combinedPrompt = messages.map(m => m.content).join("\n\n")

  const generationConfig: Record<string, unknown> = {
    temperature,
    maxOutputTokens: maxTokens,
  }
  if (jsonMode) {
    generationConfig.responseMimeType = "application/json"
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: combinedPrompt }] }],
        generationConfig,
      }),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini error ${res.status}: ${err.slice(0, 300)}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
}

// ─── Anthropic caller ─────────────────────────────────────────────────────────

async function callAnthropic(
  apiKey: string,
  messages: { role: string; content: string }[],
  options: AICallOptions,
): Promise<string> {
  const { maxTokens = 1500, temperature = 0.4 } = options

  const systemMsg = messages.find(m => m.role === "system")?.content
  const userMessages = messages
    .filter(m => m.role !== "system")
    .map(m => ({ role: m.role as "user" | "assistant", content: m.content }))

  const body: Record<string, unknown> = {
    model: "claude-3-5-haiku-20241022",
    max_tokens: maxTokens,
    temperature,
    messages: userMessages,
  }
  if (systemMsg) body.system = systemMsg

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic error ${res.status}: ${err.slice(0, 300)}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text ?? ""
}

// ─── Cohere caller ────────────────────────────────────────────────────────────

async function callCohere(
  apiKey: string,
  messages: { role: string; content: string }[],
  options: AICallOptions,
): Promise<string> {
  const { maxTokens = 1500, temperature = 0.4 } = options

  const systemMsg = messages.find(m => m.role === "system")?.content
  const userMsg = messages.filter(m => m.role !== "system").map(m => m.content).join("\n\n")

  const body: Record<string, unknown> = {
    model: "command-r-plus-08-2024",
    max_tokens: maxTokens,
    temperature,
    message: userMsg,
  }
  if (systemMsg) body.preamble = systemMsg

  const res = await fetch("https://api.cohere.com/v1/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Cohere error ${res.status}: ${err.slice(0, 300)}`)
  }

  const data = await res.json()
  return data.text ?? ""
}

// ─── Universal entrypoint ─────────────────────────────────────────────────────

/**
 * Call any supported AI provider using the key prefix to auto-route.
 * Falls back to Groq for unrecognised keys.
 *
 * @example
 *   const text = await callAI(userApiKey, "Write a subject line for...")
 *   const json = await callAI(userApiKey, "Return JSON array...", { jsonMode: true })
 */
export async function callAI(
  apiKey: string,
  prompt: string,
  options: AICallOptions = {},
): Promise<string> {
  const { provider } = detectApiKey(apiKey)

  const messages: { role: string; content: string }[] = []
  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt })
  }
  messages.push({ role: "user", content: prompt })

  switch (provider) {
    case "gemini":
      return callGemini(apiKey, messages, options)

    case "anthropic":
      return callAnthropic(apiKey, messages, options)

    case "cohere":
      return callCohere(apiKey, messages, options)

    case "openai":
    case "openrouter":
    case "perplexity":
    case "cerebras":
    case "xai":
    case "fireworks":
    case "together":
    case "mistral":
    case "huggingface": {
      const config = PROVIDER_CONFIGS[provider]!
      return callOpenAICompat(config, apiKey, messages, options)
    }

    case "groq":
    default: {
      // Groq as default fallback for unknown providers
      const groqConfig = PROVIDER_CONFIGS["groq"]!
      return callOpenAICompat(groqConfig, apiKey, messages, options)
    }
  }
}

/**
 * Call AI and parse the response as JSON.
 * The prompt should explicitly ask for JSON output.
 */
export async function callAIJson<T = unknown>(
  apiKey: string,
  prompt: string,
  options: Omit<AICallOptions, "jsonMode"> = {},
): Promise<T> {
  const raw = await callAI(apiKey, prompt, { ...options, jsonMode: true })
  // Extract JSON even if the model wrapped it in markdown fences
  const match = raw.match(/(\[[\s\S]*\]|\{[\s\S]*\})/)
  if (!match) throw new Error("AI response contained no JSON")
  return JSON.parse(match[0]) as T
}
