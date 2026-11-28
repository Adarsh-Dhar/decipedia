'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const passwordSchema = z.string().min(8, 'Use at least 8 characters.').max(128, 'Password must be 128 characters or fewer.')

export function UpdatePasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const parsed = passwordSchema.safeParse(password)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Choose a valid password.')
      return
    }
    if (password !== confirmation) {
      setError('Passwords do not match.')
      return
    }

    setPending(true)
    try {
      const supabase = createClient()
      const { data: { user }, error: sessionError } = await supabase.auth.getUser()
      if (sessionError || !user) {
        router.replace('/auth/error?reason=expired')
        return
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data })
      if (updateError) {
        setError(updateError.code === 'weak_password' ? 'Choose a stronger password.' : 'Your password could not be updated. Request a new recovery link and try again.')
        return
      }
      await supabase.auth.signOut()
      router.replace('/auth/login?recovered=1')
      router.refresh()
    } catch {
      setError('Password recovery is temporarily unavailable. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="update-password-title">
        <Link href="/" className="auth-brand">deci<span>pedia</span></Link>
        <span className="eyebrow">SECURE YOUR ACCOUNT</span>
        <h1 id="update-password-title">Choose a new password</h1>
        <p className="auth-intro">Use at least 8 characters. You&apos;ll sign in with your new password after it is saved.</p>
        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="new-password">New password<input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <label htmlFor="confirm-password">Confirm new password<input id="confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="button button-dark full-width" type="submit" disabled={pending}>{pending ? 'Updating…' : 'Update password'}</button>
        </form>
        <p className="auth-switch"><Link href="/auth/login">Back to sign in</Link></p>
      </section>
    </main>
  )
}
