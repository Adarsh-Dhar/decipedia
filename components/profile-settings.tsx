'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getOwnProfile, saveOwnProfile } from '@/lib/supabase/data'

export function ProfileSettings() {
  const { data: user } = useSWR('deci-current-user', getCurrentUser)
  const { data: profile, mutate } = useSWR(user ? ['own-profile', user.id] : null, getOwnProfile)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name)
    setBio(profile.bio)
  }, [profile])

  if (!user) return <div className="profile-signin"><p>Sign in to keep your profile private and synced across devices.</p><Link className="button button-dark" href="/auth/login?next=%2Fsettings%2Fprofile">Sign in</Link></div>

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await saveOwnProfile({ display_name: displayName.trim(), bio: bio.trim() })
      await mutate()
      setMessage('Profile saved to your account.')
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
