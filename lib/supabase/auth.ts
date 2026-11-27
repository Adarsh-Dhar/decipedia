import { createClient } from '@/lib/supabase/client'

export async function getCurrentUser() {
  const { data: { user }, error } = await createClient().auth.getUser()
  if (error || !user) return null
  return { id: user.id, email: user.email ?? '' }
}
