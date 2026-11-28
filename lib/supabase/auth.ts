import { createClient } from '@/lib/supabase/client'

export async function getCurrentUser() {
  const { data: { session }, error } = await createClient().auth.getSession()
  if (error) throw error
  const user = session?.user
  if (!user) return null
  return { id: user.id, email: user.email ?? '' }
}
