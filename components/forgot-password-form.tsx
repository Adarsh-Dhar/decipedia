'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const emailSchema = z.string().trim().email().max(254)

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    const parsedEmail = emailSchema.safeParse(email)
    if (!parsedEmail.success) {
      setError('Enter a valid email address.')
      return
    }

    setPending(true)
    try {
      const redirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent('/auth/update-password')}`
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(parsedEmail.data, { redirectTo })
      if (resetError) {
        setError(resetError.status === 429 ? 'Too many attempts. Wait a little while and try again.' : 'We could not send a recovery link right now. Please try again.')
      } else {
        setMessage('If an account exists for that email, a password recovery link is on its way.')
      }
    } catch {
      setError('Password recovery is temporarily unavailable. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="recovery-title">
        <Link href="/" className="auth-brand">deci<span>pedia</span></Link>
        <span className="eyebrow">ACCOUNT RECOVERY</span>
        <h1 id="recovery-title">Forgot your password?</h1>
        <p className="auth-intro">Enter the email address for your account and we&apos;ll send a secure reset link.</p>
        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="recovery-email">Email<input id="recovery-email" type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-notice" role="status">{message}</p>}
          <button className="button button-dark full-width" type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send recovery link'}</button>
        </form>
        <p className="auth-switch"><Link href="/auth/login">Back to sign in</Link></p>
      </section>
    </main>
  )
}
