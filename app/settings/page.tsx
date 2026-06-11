import { createClient, createServiceClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SettingsClient from "./SettingsClient"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const serviceClient = await createServiceClient()
  const { data: profileRaw } = await serviceClient
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  const profile = profileRaw as Record<string, unknown> | null

  // Strip server secrets before sending the profile to the client.
  if (profile) {
    delete profile.ai_api_key
    delete profile.apollo_api_key
  }

  return <SettingsClient profile={profile as any} />
}
