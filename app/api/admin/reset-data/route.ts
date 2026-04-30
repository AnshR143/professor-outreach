import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = await createServiceClient()

  // Delete in order: papers → emails → activities → researchers
  await supabase.from("papers").delete().in(
    "researcher_id",
    (await supabase.from("researchers").select("id").eq("user_id", user.id)).data?.map(r => r.id) || []
  )
  await supabase.from("emails").delete().eq("user_id", user.id)
  await supabase.from("activities").delete().eq("user_id", user.id)
  await supabase.from("researchers").delete().eq("user_id", user.id)

  return NextResponse.json({ success: true })
}
