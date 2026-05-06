import { createClient, createServiceClient } from "@/lib/supabase/server"
import { detectApiKey, getKeyProviderLabel } from "@/lib/ai/detect-key"
import { NextResponse } from "next/server"

// GET  returns ONLY whether a key is set and which provider it is, never the key itself
export async function GET() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = await createServiceClient()
  const { data } = await supabase
    .from("profiles")
    .select("ai_api_key")
    .eq("user_id", user.id)
    .single()

  const raw = data as { ai_api_key?: string | null } | null
  const key = raw?.ai_api_key ?? null
  return NextResponse.json({
    hasKey: !!key,
    provider: key ? detectApiKey(key).provider : null,
    providerLabel: getKeyProviderLabel(key),
  })
}

// POST  saves the key server-side, never echoes it back
export async function POST(req: Request) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { key } = await req.json()
  if (typeof key !== "string") return NextResponse.json({ error: "Invalid key" }, { status: 400 })
  // Validate format: must be at least 16 chars of safe characters
  if (key.trim().length > 0 && !/^[A-Za-z0-9_\-\.]{16,256}$/.test(key.trim())) {
    return NextResponse.json({ error: "Key format is invalid. Please paste a valid API key." }, { status: 400 })
  }
  const { isValid } = detectApiKey(key.trim())
  if (key.trim().length > 0 && !isValid) {
    // Allow saving but warn  user may have an unusual provider
    console.warn("Unrecognised API key format saved by user " + user.id)
  }

  const supabase = await createServiceClient()
  const { error } = await supabase
    .from("profiles")
    .upsert(
      { user_id: user.id, ai_api_key: key.trim() || null, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE  clears the key
export async function DELETE() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = await createServiceClient()
  await supabase
    .from("profiles")
    .update({ ai_api_key: null, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)

  return NextResponse.json({ success: true })
}
