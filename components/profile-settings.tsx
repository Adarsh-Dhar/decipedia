'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getOwnProfile, saveOwnProfile } from '@/lib/supabase/data'
import { appConfig } from '@/lib/app-config'

function getDemoProfile() {
  try {
    const stored = window.localStorage.getItem('deci-demo-profile')
    return stored ? JSON.parse(stored) as { display_name: string; bio: string } : { display_name: 'Demo Contributor', bio: '' }
  } catch {
    return { display_name: 'Demo Contributor', bio: '' }
  }
}

export function ProfileSettings() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  const isLocal = appConfig.accountMode === 'local'
  const { data: user, error: userError, isLoading: userLoading } = useSWR(isLocal ? null : 'deci-current-user', getCurrentUser)
  const { data: profile, error: profileError, mutate, isLoading: profileLoading } = useSWR(isLocal ? 'demo-profile' : user ? ['own-profile', user.id] : null, () => isLocal ? getDemoProfile() : getOwnProfile())
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name)
    setBio(profile.bio)
  }, [profile])

  if (!isLocal && !hydrated) return <p role="status">Checking your account…</p>
  if (userError) return <p className="settings-feedback" role="alert">Your account could not be checked. Refresh the page and try again.</p>
  if (profileError) return <p className="settings-feedback" role="alert">Your profile could not be loaded. Refresh the page and try again.</p>
  if (!isLocal && (userLoading || !user)) return <div className="profile-signin">{userLoading ? <p role="status">Checking your account…</p> : <><p>Sign in to keep your profile private and synced across devices.</p><Link className="button button-dark" href="/auth/login?next=%2Fsettings%2Fprofile">Sign in</Link></>}</div>
  if (profileLoading) return <p role="status">Loading your profile…</p>

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      if (isLocal) window.localStorage.setItem('deci-demo-profile', JSON.stringify({ display_name: displayName.trim(), bio: bio.trim() }))
      else await saveOwnProfile({ display_name: displayName.trim(), bio: bio.trim() })
      await mutate()
      setMessage(isLocal ? 'Demo profile saved on this device.' : 'Profile saved to your account.')
    } catch {
      setMessage('Profile could not be saved. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return <form className="profile-settings-form" onSubmit={submit}>
    <label>Display name<input autoComplete="name" maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /></label>
    <label>About you<textarea maxLength={500} rows={4} value={bio} onChange={(event) => setBio(event.target.value)} /></label>
    <button className="button button-dark" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
    {message && <p className="settings-feedback" role="status">{message}</p>}
  </form>
}
