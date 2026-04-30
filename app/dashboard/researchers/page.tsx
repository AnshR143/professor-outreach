import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ResearchersClient from "./ResearchersClient"

export default async function ResearchersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: researchers } = await supabase.from("researchers").select("*, papers(id)").eq("user_id", user.id).order("match_score", { ascending: false })
  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

  return <ResearchersClient researchers={researchers || []} profile={profile} />
}
