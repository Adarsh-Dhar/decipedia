'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { useSWRConfig } from 'swr'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/supabase/auth'
import { appConfig } from '@/lib/app-config'

export function AccountActions() {
  const isDemo = appConfig.dataMode === 'demo'
  const { data: user } = useSWR(isDemo ? null : 'deci-current-user', getCurrentUser)
  const { mutate } = useSWRConfig()

  if (isDemo) return <Link className="account-action" href="/settings/profile">Demo profile</Link>
  if (!user?.email) return <Link className="account-action" href="/auth/login">Sign in</Link>

  return <button className="account-action" type="button" title={user.email} onClick={async () => {
    const { error } = await createClient().auth.signOut()
    if (!error) await mutate('deci-current-user', null, { revalidate: false })
  }}>Sign out</button>
}
