import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import TemplatesClient from "./TemplatesClient"

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: templates } = await supabase.from("templates").select("*").or(`user_id.is.null,user_id.eq.${user.id}`).order("created_at")
  const { data: profile } = await supabase.from("profiles").select("name").eq("user_id", user.id).single()
  return <TemplatesClient templates={templates || []} userId={user.id} userName={profile?.name || ""} />
}
