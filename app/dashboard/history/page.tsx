import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import HistoryClient from "./HistoryClient"

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: allActivities } = await supabase.from("activities").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200)
  const { data: profile } = await supabase.from("profiles").select("name").eq("user_id", user.id).single()
  const activities = allActivities || []
  const researchActivities = activities.filter(a => !a.category || a.category === "research")
  const internshipActivities = activities.filter(a => a.category === "internship")
  return <HistoryClient researchActivities={researchActivities} internshipActivities={internshipActivities} userName={profile?.name || ""} />
}
