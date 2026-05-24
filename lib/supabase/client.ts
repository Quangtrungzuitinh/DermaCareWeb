import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

function isInvalidRefreshToken(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string" &&
    (error as { message: string }).message.toLowerCase().includes("invalid refresh token")
  )
}

export async function getUserSafely(supabase: SupabaseClient = createClient()) {
  const { data, error } = await supabase.auth.getUser()

  if (!error) return data.user
  if (isInvalidRefreshToken(error)) {
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined)
    return null
  }

  throw error
}
