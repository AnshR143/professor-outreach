import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import StatisticsClient from "./StatisticsClient"

export default async function StatisticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: researchers } = await supabase.from("researchers").select("*").eq("user_id", user.id).order("match_score", { ascending: false })
  const { data: emails } = await supabase.from("emails").select("*").eq("user_id", user.id)
  const { data: profile } = await supabase.from("profiles").select("name").eq("user_id", user.id).single()

  return <StatisticsClient researchers={researchers || []} emails={emails || []} userName={profile?.name || ""} />
}
