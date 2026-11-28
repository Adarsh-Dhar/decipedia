import { Suspense } from 'react'
import { AppShell } from '../../app-shell'
import { EditorView } from '../../decipedia-app'

export default function NewArticlePage() {
  return <AppShell><Suspense fallback={<div className="loading-state">Loading editor…</div>}><EditorView /></Suspense></AppShell>
}
