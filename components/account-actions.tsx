'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { useSWRConfig } from 'swr'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/supabase/auth'

export function AccountActions() {
  const { data: user } = useSWR('deci-current-user', getCurrentUser)
  const { mutate } = useSWRConfig()

  if (!user?.email) return <Link className="account-action" href="/auth/login">Sign in</Link>

  return <button className="account-action" type="button" title={user.email} onClick={async () => {
    const { error } = await createClient().auth.signOut()
    if (!error) await mutate('deci-current-user', null, { revalidate: false })
  }}>Sign out</button>
}
