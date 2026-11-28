import Link from 'next/link'

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams
  const expired = reason === 'expired'
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-error-title">
        <Link href="/" className="auth-brand">deci<span>pedia</span></Link>
        <span className="eyebrow">ACCOUNT RECOVERY</span>
        <h1 id="auth-error-title">{expired ? 'This link has expired' : 'This link could not be verified'}</h1>
        <p className="auth-intro">{expired ? 'Request a new password recovery email and use the latest link to continue.' : 'The link may be invalid or already used. Request a fresh recovery email to try again.'}</p>
        <Link className="button button-dark full-width" href="/auth/forgot-password">Request a new link</Link>
        <p className="auth-switch"><Link href="/auth/login">Back to sign in</Link></p>
      </section>
    </main>
  )
}
