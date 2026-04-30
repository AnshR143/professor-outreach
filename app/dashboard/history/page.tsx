import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import HistoryClient from "./HistoryClient"

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: activities } = await supabase.from("activities").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100)
  const { data: profile } = await supabase.from("profiles").select("name").eq("user_id", user.id).single()
  return <HistoryClient activities={activities || []} userName={profile?.name || ""} />
}
