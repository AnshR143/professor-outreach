import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Auth callback error:", error.message)
      return NextResponse.redirect(`${origin}/login?verified=1`)
    }

    if (data?.user) {
      const user = data.user
      // Upsert so it never fails silently — if row exists, leave onboarding_complete alone
      const { data: existing } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (!existing) {
        const { error: insertErr } = await supabase.from("profiles").insert({
          user_id: user.id,
          name: user.user_metadata?.name || "",
          email: user.email || "",
          interests: [],
          goals: [],
          majors: [],
          academic_level: "",
          institution: "",
          onboarding_complete: false,
        })
        if (insertErr) console.error("Profile insert error:", insertErr.message)
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
