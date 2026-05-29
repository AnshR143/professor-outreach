import { createClient } from "@/lib/supabase/server"
import DashboardClient from "./DashboardClient"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("user_id", user.id).single()

  // null profile (insert may have failed) OR incomplete onboarding → send to onboarding
  if (!profile || !profile.onboarding_complete) redirect("/onboarding")

  const { data: researchers } = await supabase
    .from("researchers").select("id, name, university, status, match_score, research_areas").eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const { data: activities } = await supabase
    .from("activities").select("*").eq("user_id", user.id)
    .order("created_at", { ascending: false }).limit(20)

  // Outreach actions for the Weekly Activity chart. Fetched separately (and
  // filtered to email-sent types) so a busy week of other activity can't push
  // sent emails out of the 20-row feed above.
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data: weeklyOutreach } = await supabase
    .from("activities").select("type, created_at").eq("user_id", user.id)
    .in("type", ["email_sent", "internship_email_sent"])
    .gte("created_at", twoWeeksAgo)
    .order("created_at", { ascending: false })

  const { data: emails } = await supabase
    .from("emails").select("id, status").eq("user_id", user.id)

  return (
    <DashboardClient
      profile={profile}
      researchers={researchers || []}
      activities={activities || []}
      weeklyOutreach={weeklyOutreach || []}
      emails={emails || []}
    />
  )
}
