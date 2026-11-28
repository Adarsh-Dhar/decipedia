import { notFound } from 'next/navigation'
import { AppShell } from '../../app-shell'
import { TopicsView } from '../../decipedia-app'
import { demoRepositories } from '@/lib/repositories'
import { appConfig } from '@/lib/app-config'

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (appConfig.contentMode === 'demo' && !demoRepositories.topics.get(slug)) notFound()
  return <AppShell><TopicsView selected={slug} /></AppShell>
}
