import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = await createServiceClient()

  // Delete in order: papers → emails → activities → internship_contacts → researchers
  const { data: researcherRows } = await supabase.from("researchers").select("id").eq("user_id", user.id)
  const researcherIds = (researcherRows ?? []).map((r: { id: string }) => r.id)
  await supabase.from("papers").delete().in("researcher_id", researcherIds)
  await supabase.from("emails").delete().eq("user_id", user.id)
  await supabase.from("activities").delete().eq("user_id", user.id)
  await supabase.from("internship_contacts").delete().eq("user_id", user.id)
  await supabase.from("researchers").delete().eq("user_id", user.id)

  return NextResponse.json({ success: true })
}
