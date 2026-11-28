'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { articles, contributors } from '@/lib/decipedia'

export function ContributorDirectory({ username }: { username?: string }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'with-articles'>('all')
  const person = contributors.find((item) => item.username === username)
  const listed = useMemo(() => contributors
    .map((contributor) => ({ ...contributor, catalogArticles: articles.filter((article) => article.author === contributor.name) }))
    .filter((contributor) => filter === 'all' || contributor.catalogArticles.length > 0)
    .filter((contributor) => `${contributor.name} ${contributor.username} ${contributor.bio} ${contributor.catalogArticles.map((article) => article.title).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => b.catalogArticles.length - a.catalogArticles.length || a.name.localeCompare(b.name)), [filter, query])
  const profileArticles = person ? articles.filter((article) => article.author === person.name) : []

  return <>
    {person ? <>
      <div className="profile-panel"><div className={`avatar avatar-${person.color}`} aria-hidden="true">{person.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div><span className="eyebrow">@{person.username}</span><h2>{person.name}</h2><p>{person.bio}</p><div className="profile-stats"><span><b>{profileArticles.length}</b> articles in this demo catalog</span><span><b>{profileArticles.reduce((total, article) => total + article.revisions, 0)}</b> revisions across those articles</span></div></div></div>
      <div className="section-heading inner-heading"><div><span className="eyebrow">CATALOG CONTRIBUTIONS</span><h2>Articles by {person.name.split(' ')[0]}</h2></div></div>
      <div className="recent-list">{profileArticles.length ? profileArticles.map((article) => <Link className="activity-row" href={`/articles/${article.slug}`} key={article.slug}><span className="row-main"><b>{article.title}</b><span>{article.summary}</span></span><span>{article.revisions} revisions</span></Link>) : <p>No articles by this contributor are included in the demo catalog.</p>}</div>
    </> : <>
      <div className="explore-controls contributor-controls"><label className="explore-search"><Search size={17}/><input aria-label="Search contributors" placeholder="Search contributors or articles..." value={query} onChange={(event) => setQuery(event.target.value)}/></label><label className="select-wrap"><span className="sr-only">Filter contributors</span><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">All contributors</option><option value="with-articles">With catalog articles</option></select></label></div>
      <p className="results-label" aria-live="polite">{listed.length} contributors · statistics reflect the {articles.length}-article demo catalog</p>
      <div className="contributors-grid">{listed.length ? listed.map((contributor) => <Link href={`/contributors/${contributor.username}`} className="contributor-card" key={contributor.username}><div className={`avatar avatar-${contributor.color}`} aria-hidden="true">{contributor.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><span className="eyebrow">@{contributor.username}</span><h3>{contributor.name}</h3><p>{contributor.bio}</p><div className="contribution-counts"><span><b>{contributor.catalogArticles.length}</b> catalog articles</span><span><b>{contributor.catalogArticles.reduce((total, article) => total + article.revisions, 0)}</b> revisions on those articles</span></div></Link>) : <div className="empty-state"><Search size={24}/><h3>No contributors found</h3><p>Try a different name or clear the catalog filter.</p><button className="button button-outline" onClick={() => { setQuery(''); setFilter('all') }}>Clear filters</button></div>}</div>
    </>}
  </>
}
