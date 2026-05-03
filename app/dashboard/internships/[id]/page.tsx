import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import InternshipDetailClient from "./InternshipDetailClient"

export default async function InternshipDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: contact } = await supabase.from("internship_contacts").select("*").eq("id", params.id).eq("user_id", user.id).single()
  if (!contact) redirect("/dashboard/internships")
  const { data: emails } = await supabase.from("internship_emails").select("*").eq("contact_id", params.id).order("created_at", { ascending: false })
  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()
  return <InternshipDetailClient contact={contact} emails={emails || []} profile={profile} />
}
