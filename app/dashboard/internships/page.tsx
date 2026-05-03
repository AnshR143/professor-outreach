import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import InternshipsClient from "./InternshipsClient"

export default async function InternshipsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: contacts } = await supabase.from("internship_contacts").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
  const { data: profile } = await supabase.from("profiles").select("name").eq("user_id", user.id).single()
  return <InternshipsClient contacts={contacts || []} userName={profile?.name || ""} />
}
