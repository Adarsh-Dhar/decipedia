import { AppShell } from '../../../../app-shell'
import { HistoryView } from '../../../../decipedia-app'

export default async function CompareRevisionsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <AppShell><HistoryView slug={slug} compare /></AppShell>
}
