import { AppShell } from '../../app-shell'
import { ArticleView } from '../../decipedia-app'

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <AppShell><ArticleView slug={slug} /></AppShell>
}
