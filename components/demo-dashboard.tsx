'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { ArrowRight, Bookmark, FilePlus2, NotebookPen } from 'lucide-react'
import { demoRepositories } from '@/lib/repositories'

export function DemoContributions() {
  const { data: drafts = [], mutate } = useSWR('demo-contributions-drafts', () => demoRepositories.drafts.list())
  const articles = demoRepositories.articles.list().items.filter((article) => article.author === 'Demo Contributor')
  return <div className="dashboard-grid">
      <section className="dashboard-card"><span className="eyebrow">PUBLISHED ARTICLES</span><h3>{articles.length ? `${articles.length} article${articles.length === 1 ? '' : 's'}` : 'No published articles yet'}</h3>{articles.length ? <div className="recent-list">{articles.map((article) => <div className="activity-row" key={article.slug}><Link className="row-main" href={`/articles/${article.slug}`}><b>{article.title}</b><span>{article.summary}</span></Link><Link className="button button-quiet" href={`/articles/${article.slug}/edit`}>Edit</Link></div>)}</div> : <p>Your demo publications will appear here after you publish an article.</p>}<Link className="text-link" href="/articles/new"><FilePlus2 size={14}/>Start an article<ArrowRight size={14}/></Link></section>
      <section className="dashboard-card"><span className="eyebrow">SAVED DRAFTS</span><h3>{drafts.length ? `${drafts.length} draft${drafts.length === 1 ? '' : 's'}` : 'No drafts yet'}</h3>{drafts.length ? <div className="recent-list">{drafts.map((draft) => <div className="activity-row" key={draft.id}><Link href={`/articles/new?draft=${draft.id}`} className="row-main"><b>{draft.title || 'Untitled draft'}</b><span>{draft.summary || 'Continue writing your article.'}</span></Link><button className="button button-quiet" onClick={() => { demoRepositories.drafts.remove(draft.id); void mutate() }}>Remove</button></div>)}</div> : <p>Drafts autosave locally as you write and will be available when you return on this device.</p>}<Link className="text-link" href="/articles/new"><FilePlus2 size={14}/>Create a draft<ArrowRight size={14}/></Link></section>
  </div>
}

export function DemoDashboard() {
  const { data: drafts = [] } = useSWR('dashboard-demo-drafts', () => demoRepositories.drafts.list())
  const { data: saved = [] } = useSWR('dashboard-demo-bookmarks', () => demoRepositories.bookmarks.list())
  const contributions = demoRepositories.articles.list().items.filter((article) => article.author === 'Demo Contributor')
  return <div className="page-intro">
    <div className="page-heading"><span className="eyebrow">YOUR SPACE IN THE COMMONS</span><h1>Welcome, contributor</h1><p>Your demo drafts, published articles, and saved reading live here on this device.</p></div>
    <div className="guest-banner"><span className="guest-icon"><NotebookPen size={20}/></span><span><b>Demo workspace</b><small>Changes are stored in this browser only. Sign in when account sync is enabled.</small></span><span className="demo-note">Local demo</span></div>
    <div className="dashboard-grid">
      <section className="dashboard-card"><span className="eyebrow">YOUR ARTICLES</span><h3>{contributions.length ? `${contributions.length} published article${contributions.length === 1 ? '' : 's'}` : 'Your first contribution'}</h3><p>{contributions.length ? 'Continue improving your articles or review their revision histories.' : 'Publish a demo article to see your work and revision history here.'}</p>{contributions.slice(0, 3).map((article) => <Link className="text-link" href={`/articles/${article.slug}`} key={article.slug}>{article.title}<ArrowRight size={14}/></Link>)}<Link className="text-link" href="/articles/new"><FilePlus2 size={14}/>Write an article</Link></section>
      <section className="dashboard-card"><span className="eyebrow">SAVED KNOWLEDGE</span><h3>{saved.length ? `${saved.length} saved article${saved.length === 1 ? '' : 's'}` : 'Keep good ideas close'}</h3><p>{saved.length ? 'Your reading list is saved on this device.' : 'Bookmark an article and it will be waiting in your reading list.'}</p><Link className="text-link" href="/saved"><Bookmark size={14}/>View saved articles<ArrowRight size={14}/></Link></section>
      <section className="dashboard-card"><span className="eyebrow">DRAFTS</span><h3>{drafts.length ? `${drafts.length} draft${drafts.length === 1 ? '' : 's'} in progress` : 'A thought in progress'}</h3><p>{drafts.length ? 'Pick up where you left off. Drafts autosave on this device.' : 'Start an article and your draft will be recovered when you return.'}</p>{drafts.slice(0, 3).map((draft) => <Link className="text-link" href={`/articles/new?draft=${draft.id}`} key={draft.id}>{draft.title || 'Untitled draft'}<ArrowRight size={14}/></Link>)}<Link className="text-link" href="/articles/new"><FilePlus2 size={14}/>Create a draft</Link></section>
    </div>
  </div>
}
