import { createServiceClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const supabase = await createServiceClient()

  // 1. Delete user profile and data (cascading usually handles this, but let's be sure)
  // Profiles table is linked to auth.users with ON DELETE CASCADE
  
  // 2. Delete user from auth.users
  const { error } = await supabase.auth.admin.deleteUser(user.id)

  if (error) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
