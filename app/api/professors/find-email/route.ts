import { createClient, createServiceClient } from "@/lib/supabase/server"
import { detectApiKey, isGeminiKey } from "@/lib/ai/detect-key"

async function callGroq(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 50,
    }),
  })
  if (!res.ok) throw new Error("Groq error " + res.status)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ""
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 50 },
      }),
    }
  )
  if (!res.ok) throw new Error("Gemini error " + res.status)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
}

export async function POST(req: Request) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { researcherName, university, areas } = await req.json()
  if (!researcherName || !university) {
    return new Response(JSON.stringify({ error: "Missing name or university" }), { status: 400 })
  }

  const supabase = await createServiceClient()
  const { data: profile } = await supabase.from("profiles").select("ai_api_key").eq("user_id", user.id).single()
  const aiKey = (profile as any)?.ai_api_key || process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY

  if (!aiKey) {
    return new Response(JSON.stringify({ error: "No AI API key found. Add one in Settings." }), { status: 400 })
  }

  const prompt = `Find the exact professional email address for professor "${researcherName}" at "${university}".
${areas && areas.length > 0 ? `They work in: ${areas.join(", ")}.` : ""}
Be extremely precise. Many large universities use specific subdomains for different departments (e.g., @hms.harvard.edu for Medical School, @cs.stanford.edu for Computer Science, @chicagobooth.edu for Business).
Think about the specific department or school this professor belongs to based on their field and use the correct subdomain pattern.
Return ONLY the email address. No other text.`

  try {
    const raw = isGeminiKey(aiKey) ? await callGemini(aiKey, prompt) : await callGroq(aiKey, prompt)
    const email = raw.trim().match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || ""
    
    return new Response(JSON.stringify({ email }), { headers: { "Content-Type": "application/json" } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}
