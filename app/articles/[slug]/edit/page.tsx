import { Suspense } from 'react'
import { AppShell } from '../../../app-shell'
import { EditorView } from '../../../decipedia-app'

export default async function EditArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <AppShell><Suspense fallback={<div className="loading-state">Loading editor…</div>}><EditorView slug={slug} /></Suspense></AppShell>
}
