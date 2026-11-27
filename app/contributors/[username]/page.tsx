import { notFound } from 'next/navigation'
import { AppShell } from '../../app-shell'
import { ContributorsView } from '../../decipedia-app'
import { demoRepositories } from '@/lib/repositories'
import { appConfig } from '@/lib/app-config'

export default async function ContributorPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  if (appConfig.dataMode === 'demo' && !demoRepositories.contributors.get(username)) notFound()
  return <AppShell><ContributorsView username={username} /></AppShell>
}
