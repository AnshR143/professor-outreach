import { createClient } from "@/lib/supabase/server"
import DashboardClient from "./DashboardClient"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("user_id", user.id).single()

  if (profile && !profile.onboarding_complete) redirect("/onboarding")

  const { data: researchers } = await supabase
    .from("researchers").select("id, name, university, status, match_score, research_areas").eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const { data: activities } = await supabase
    .from("activities").select("*").eq("user_id", user.id)
    .order("created_at", { ascending: false }).limit(20)

  const { data: emails } = await supabase
    .from("emails").select("id, status").eq("user_id", user.id)

  return (
    <DashboardClient
      profile={profile}
      researchers={researchers || []}
      activities={activities || []}
      emails={emails || []}
    />
  )
}
