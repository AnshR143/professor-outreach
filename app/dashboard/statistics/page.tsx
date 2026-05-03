import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import StatisticsClient from "./StatisticsClient"

export default async function StatisticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: researchers } = await supabase.from("researchers").select("*").eq("user_id", user.id).order("match_score", { ascending: false })
  const { data: emails } = await supabase.from("emails").select("*").eq("user_id", user.id)
  const { data: internshipContacts } = await supabase.from("internship_contacts").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
  const { data: profile } = await supabase.from("profiles").select("name").eq("user_id", user.id).single()

  return <StatisticsClient
    researchers={researchers || []}
    emails={emails || []}
    internshipContacts={internshipContacts || []}
    userName={profile?.name || ""}
  />
}
