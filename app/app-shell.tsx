import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { DecipediaApp } from './decipedia-app'

export function AppShell({ children }: { children: ReactNode }) {
  return <DecipediaApp><Suspense fallback={<div className="page-loading" role="status">Loading page…</div>}>{children}</Suspense></DecipediaApp>
}
