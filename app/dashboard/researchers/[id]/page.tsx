import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import ResearcherDetailClient from "./ResearcherDetailClient"

export default async function ResearcherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: researcher } = await supabase.from("researchers").select("*").eq("id", id).eq("user_id", user.id).single()
  if (!researcher) notFound()

  const { data: papers } = await supabase.from("papers").select("*").eq("researcher_id", id).order("published_date", { ascending: false })
  const { data: emails } = await supabase.from("emails").select("*").eq("researcher_id", id).order("created_at", { ascending: false })
  const { data: templates } = await supabase.from("templates").select("*").or("user_id.is.null,user_id.eq." + user.id)
  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

  // Get prev/next researchers
  const { data: allResearchers } = await supabase.from("researchers").select("id").eq("user_id", user.id).order("match_score", { ascending: false })
  const idx = allResearchers?.findIndex(r => r.id === id) ?? -1
  const prevId = idx > 0 ? allResearchers![idx - 1].id : null
  const nextId = idx < (allResearchers?.length ?? 0) - 1 ? allResearchers![idx + 1].id : null
  const position = { current: idx + 1, total: allResearchers?.length ?? 0, prevId, nextId }

  return (
    <ResearcherDetailClient
      researcher={researcher}
      papers={papers || []}
      emails={emails || []}
      templates={templates || []}
      profile={profile}
      position={position}
    />
  )
}
