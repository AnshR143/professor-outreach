import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CampaignsClient from "./CampaignsClient"

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: emails } = await supabase.from("emails").select("*, researchers(name, university, research_areas)").eq("user_id", user.id).order("created_at", { ascending: false })
  const { data: profile } = await supabase.from("profiles").select("name").eq("user_id", user.id).single()
  return <CampaignsClient emails={emails || []} userName={profile?.name || ""} />
}
