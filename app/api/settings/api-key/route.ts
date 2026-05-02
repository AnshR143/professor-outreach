import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET — returns ONLY whether a key is set, never the key itself
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
  return NextResponse.json({ hasKey: !!(raw?.ai_api_key) })
}

// POST — saves the key server-side, never echoes it back
export async function POST(req: Request) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { key } = await req.json()
  if (typeof key !== "string") return NextResponse.json({ error: "Invalid key" }, { status: 400 })

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

// DELETE — clears the key
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
