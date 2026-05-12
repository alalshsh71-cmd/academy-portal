import { createClient } from '@supabase/supabase-js'

// ⚠️ سيرفر فقط - لا ترسله للمتصفح أبدًا
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}