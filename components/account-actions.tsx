'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { useSWRConfig } from 'swr'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/supabase/auth'
import { appConfig } from '@/lib/app-config'

export function AccountActions() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  const isLocal = appConfig.accountMode === 'local'
  const { data: user, error, isLoading } = useSWR(isLocal ? null : 'deci-current-user', getCurrentUser)
  const { mutate } = useSWRConfig()

  if (isLocal) return <Link className="account-action" href="/settings/profile">Demo profile</Link>
  if (!hydrated) return <span className="account-action" role="status">Checking account…</span>
  if (error) return <span className="account-action" role="alert">Account unavailable</span>
  if (isLoading) return <span className="account-action" role="status">Checking account…</span>
  if (!user?.email) return <Link className="account-action" href="/auth/login">Sign in</Link>

  return <button className="account-action" type="button" title={user.email} onClick={async () => {
    const { error } = await createClient().auth.signOut()
    if (error) {
      window.alert('You could not be signed out. Please try again.')
      return
    }
    await mutate('deci-current-user', null, { revalidate: false })
  }}>Sign out</button>
}
