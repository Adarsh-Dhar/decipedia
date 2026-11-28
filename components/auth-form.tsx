'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useSWRConfig } from 'swr'
import { createClient } from '@/lib/supabase/client'

type AuthFormProps = { mode: 'login' | 'sign-up' }

function safeNextPath() {
  const requested = new URLSearchParams(window.location.search).get('next')
  return requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/'
}

function messageForError(error: { code?: string; status?: number }) {
  if (error.code === 'email_not_confirmed') return 'Confirm your email using the link we sent before signing in.'
  if (error.code === 'weak_password') return 'Choose a stronger password with at least 8 characters.'
  if (error.code === 'over_email_send_rate_limit' || error.status === 429) return 'Too many attempts. Wait a little while and try again.'
  if (error.code === 'invalid_credentials' || error.code === 'user_not_found' || error.code === 'email_exists') return 'We could not complete that request. Check your details or try signing in.'
  return 'Something unexpected happened. Please try again.'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    setPending(true)

    try {
      const supabase = createClient()
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
            data: { display_name: displayName.trim() },
          },
        })

        if (signUpError) {
          setError(messageForError(signUpError))
        } else if (!data.session) {
          setNotice('If this email can be registered, a confirmation link is on its way. Confirm your email before saving drafts or bookmarks.')
        } else if (!data.user) {
          throw new Error('A user session was returned without a user.')
        } else {
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            display_name: displayName.trim(),
            bio: '',
            updated_at: new Date().toISOString(),
          })
          if (profileError) throw profileError
          await mutate('deci-current-user')
          router.replace(safeNextPath())
          router.refresh()
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (signInError) setError(messageForError(signInError))
        else {
          await mutate('deci-current-user')
          router.replace(safeNextPath())
          router.refresh()
        }
      }
    } catch {
      setError('Authentication is temporarily unavailable. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link href="/" className="auth-brand">deci<span>pedia</span></Link>
        <span className="eyebrow">YOUR KNOWLEDGE COMMONS</span>
        <h1 id="auth-title">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-intro">{isSignUp ? 'Sign in to keep your drafts, reading list, and preferences synced securely.' : 'Sign in to pick up where you left off.'}</p>
        <form className="auth-form" onSubmit={submit}>
          {isSignUp && <label>Name<input autoComplete="name" maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /></label>}
          <label>Email<input type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {notice && <p className="auth-notice" role="status">{notice}</p>}
          <button className="button button-dark full-width" type="submit" disabled={pending}>{pending ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}</button>
        </form>
        <p className="auth-switch">{isSignUp ? 'Already have an account?' : 'New to Decipedia?'}{' '}<Link href={isSignUp ? '/auth/login' : '/auth/sign-up'}>{isSignUp ? 'Sign in' : 'Create an account'}</Link></p>
        <p className="auth-privacy">Your saved data is private to your account.</p>
      </section>
    </main>
  )
}
