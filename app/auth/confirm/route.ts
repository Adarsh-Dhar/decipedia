import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function safeNextPath(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : '/'
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type')
  if (!tokenHash || type !== 'recovery') {
    return NextResponse.redirect(new URL('/auth/error?reason=invalid', request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
  if (error) {
    return NextResponse.redirect(new URL('/auth/error?reason=expired', request.url))
  }

  const next = safeNextPath(request.nextUrl.searchParams.get('next'))
  return NextResponse.redirect(new URL(next, request.url))
}
