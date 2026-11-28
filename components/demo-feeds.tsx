'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { Activity, Bell, Check } from 'lucide-react'
import { demoRepositories } from '@/lib/repositories'

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2)
}

export function DemoActivityFeed() {
  const { data: events = [] } = useSWR('demo-activity-feed', async () => (await demoRepositories.activity.list()).items)
  if (!events.length) return <div className="empty-state"><Activity size={25} /><h3>No activity yet</h3><p>New article publications and edits will show up here.</p><Link className="button button-outline" href="/articles/new">Write an article</Link></div>
  return <div className="revision-list">{events.map((event) => {
    const article = demoRepositories.articles.get(event.articleSlug)
    return <Link className="revision-item" href={article ? `/articles/${article.slug}` : '/activity'} key={event.id}>
      <span className="avatar">{initials(event.actor)}</span>
      <span className="revision-content"><span className="revision-title"><b>{event.actor}</b><span className="current-tag">{event.type === 'article-created' ? 'Published' : 'Edited'}</span></span><p>{event.summary}{article ? ` · ${article.title}` : ''}</p><span className="revision-meta">{new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(event.createdAt))}</span></span>
    </Link>
  })}</div>
}

export function DemoNotificationsFeed() {
  const { data: notifications = [], mutate } = useSWR('demo-notifications-feed', () => demoRepositories.notifications.list())
  const unreadCount = notifications.filter((notification) => !notification.readAt).length
  return <section aria-label="Demo notifications">
    <div className="history-header"><span className="demo-note">{unreadCount} unread</span><button className="button button-quiet" onClick={() => { void demoRepositories.notifications.markAllRead().then(() => mutate()) }} disabled={!unreadCount}>Mark all as read</button></div>
    <div className="revision-list">{notifications.map((notification) => <article className="revision-item" key={notification.id}>
      <span className={`avatar ${notification.readAt ? '' : 'avatar-sage'}`}>{notification.readAt ? <Check size={15} /> : <Bell size={15} />}</span>
      <span className="revision-content"><span className="revision-title"><b>{notification.title}</b>{!notification.readAt && <span className="notification-dot" aria-label="Unread" />}</span><p>{notification.body}</p><span className="revision-meta">{new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(notification.createdAt))}</span></span>
      {!notification.readAt && <button className="button button-quiet" onClick={() => { void demoRepositories.notifications.markRead(notification.id).then(() => mutate()) }}>Mark read</button>}
    </article>)}</div>
  </section>
}
