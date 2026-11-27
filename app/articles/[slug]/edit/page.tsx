import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { AppShell } from '../../../app-shell'
import { EditorView } from '../../../decipedia-app'
import { demoRepositories } from '@/lib/repositories'
import { appConfig } from '@/lib/app-config'

export default async function EditArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (appConfig.dataMode === 'demo' && !demoRepositories.articles.get(slug)) notFound()
  return <AppShell><Suspense fallback={<div className="loading-state">Loading editor…</div>}><EditorView slug={slug} /></Suspense></AppShell>
}
