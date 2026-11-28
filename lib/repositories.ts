import { articles as articleFixtures, contributors as contributorFixtures, topics as topicFixtures, type Article } from './decipedia'

export type Awaitable<T> = T | Promise<T>
export type PageQuery = { cursor?: string; limit?: number }
export type PageResult<T> = { items: T[]; nextCursor?: string; total?: number }
export type SearchQuery = PageQuery & { query?: string; topic?: string; sort?: 'updated' | 'reading' | 'revisions' }

export interface ArticleRepository {
  list(query?: SearchQuery, signal?: AbortSignal): Awaitable<PageResult<Article>>
  get(slug: string, signal?: AbortSignal): Awaitable<Article | undefined>
  create?(input: ArticleDraftInput, signal?: AbortSignal): Promise<Article>
  update?(slug: string, input: ArticleDraftInput, signal?: AbortSignal): Promise<Article>
}
export type ArticleDraftInput = Pick<Article, 'title' | 'summary' | 'topic' | 'tags' | 'content' | 'references'>
export type Topic = (typeof topicFixtures)[number]
export type Contributor = (typeof contributorFixtures)[number]
export type Revision = { id: string; articleId: string; number: number; author: string; createdAt: string; summary: string; content: string; snapshot?: ArticleDraftInput; transactionHash?: string }
export type ActivityEvent = { id: string; type: 'article-created' | 'article-updated' | 'revision-published'; actor: string; articleSlug: string; createdAt: string; summary: string }
export type UserProfile = { id: string; displayName: string; walletAddress?: string; bio?: string; avatarUrl?: string }
export type Draft = { id: string; title: string; summary: string; topic: string; tags: string[]; content: string; savedAt: string; references?: string[]; articleSlug?: string | null }
export type Bookmark = { articleSlug: string; savedAt: string }
export type Notification = { id: string; title: string; body: string; createdAt: string; readAt?: string }

export interface TopicRepository { list(signal?: AbortSignal): Awaitable<Topic[]>; get(slug: string, signal?: AbortSignal): Awaitable<Topic | undefined> }
export interface RevisionRepository { list(articleId: string, signal?: AbortSignal): Awaitable<Revision[]>; compare(articleId: string, fromId: string, toId: string, signal?: AbortSignal): Awaitable<{ before: string; after: string } | undefined> }
export interface ContributorRepository { list(query?: PageQuery, signal?: AbortSignal): Awaitable<PageResult<Contributor>>; get(username: string, signal?: AbortSignal): Awaitable<Contributor | undefined> }
export interface ActivityRepository { list(query?: PageQuery, signal?: AbortSignal): Awaitable<PageResult<ActivityEvent>> }
export interface UserRepository { getCurrent(signal?: AbortSignal): Promise<UserProfile | undefined>; getByWallet(address: string, signal?: AbortSignal): Awaitable<UserProfile | undefined> }
export interface DraftRepository { list(): Draft[]; get(id: string): Draft | undefined; save(draft: Draft): boolean; remove(id: string): boolean }
export interface BookmarkRepository { list(): Bookmark[]; has(articleSlug: string): boolean; toggle(articleSlug: string): boolean }
export interface PreferenceRepository { getTheme(): 'light' | 'dark' | undefined; setTheme(theme: 'light' | 'dark'): boolean }
export interface NotificationRepository { list(signal?: AbortSignal): Awaitable<Notification[]>; markRead(id: string, signal?: AbortSignal): Promise<void>; markAllRead(signal?: AbortSignal): Promise<void> }

export type DecipediaRepositories = {
  articles: ArticleRepository; topics: TopicRepository; revisions: RevisionRepository; contributors: ContributorRepository
  activity: ActivityRepository; users: UserRepository; drafts: DraftRepository; bookmarks: BookmarkRepository
  preferences: PreferenceRepository; notifications: NotificationRepository
}

type DemoArticleRepository = Omit<ArticleRepository, 'list' | 'get'> & { list(query?: SearchQuery): PageResult<Article>; get(slug: string): Article | undefined }
type DemoTopicRepository = Omit<TopicRepository, 'list' | 'get'> & { list(): Topic[]; get(slug: string): Topic | undefined }
type DemoContributorRepository = Omit<ContributorRepository, 'list' | 'get'> & { list(query?: PageQuery): PageResult<Contributor>; get(username: string): Contributor | undefined }
export type DemoRepositories = Omit<DecipediaRepositories, 'articles' | 'topics' | 'contributors' | 'revisions' | 'activity' | 'notifications'> & {
  articles: DemoArticleRepository; topics: DemoTopicRepository; contributors: DemoContributorRepository
  revisions: Omit<RevisionRepository, 'list' | 'compare'> & { list(articleId: string): Revision[]; compare(articleId: string, fromId: string, toId: string): { before: string; after: string } | undefined }
  activity: Omit<ActivityRepository, 'list'> & { list(query?: PageQuery): PageResult<ActivityEvent> }
  notifications: Omit<NotificationRepository, 'list'> & { list(): Notification[] }
}

let demoStorageReady = false
export function activateDemoStorage() { demoStorageReady = true }

const STORAGE = {
  articles: 'deci-demo-articles', drafts: 'deci-drafts', bookmarks: 'deci-bookmarks', theme: 'deci-theme',
  revisions: 'deci-demo-revisions', activity: 'deci-demo-activity', notifications: 'deci-demo-notifications',
} as const

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !demoStorageReady) return fallback
  try {
    const value = window.localStorage.getItem(key)
    return value === null ? fallback : JSON.parse(value) as T
  } catch { return fallback }
}
function writeStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false
  try { window.localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}
function normalizeSearchText(value: string) { return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim() }
function matchesSearch(query: string, text: string) { return query.split(/\s+/).filter(Boolean).every((term) => text.includes(term)) }
function currentArticles() { return readStorage<Article[]>(STORAGE.articles, articleFixtures).map((article) => ({ ...article, tags: [...article.tags], references: [...(article.references || [])] })) }
function currentRevisions() { return readStorage<Revision[]>(STORAGE.revisions, []) }
const sampleActivity: ActivityEvent[] = articleFixtures.slice(0, 6).map((article, index) => ({ id: `sample-activity-${article.id}`, type: index % 3 === 0 ? 'article-created' : 'revision-published', actor: article.author, articleSlug: article.slug, createdAt: `${article.updatedAt}T12:00:00.000Z`, summary: index % 3 === 0 ? 'Published a new article' : 'Improved an article revision' }))
const sampleNotifications: Notification[] = [
  { id: 'sample-notification-1', title: 'Welcome to Decipedia', body: 'Explore the commons and save articles to build your reading list.', createdAt: '2026-11-25T09:00:00.000Z' },
  { id: 'sample-notification-2', title: 'New guide in Developer Tools', body: 'A beginner’s guide to Gno.land is ready to read.', createdAt: '2026-11-22T14:30:00.000Z' },
  { id: 'sample-notification-3', title: 'Community update', body: 'Contributors added new perspectives to the open knowledge commons.', createdAt: '2026-11-20T11:00:00.000Z', readAt: '2026-11-21T08:00:00.000Z' },
]
function currentActivity() { return readStorage<ActivityEvent[]>(STORAGE.activity, sampleActivity) }
function currentNotifications() { return readStorage<Notification[]>(STORAGE.notifications, sampleNotifications) }
function updateLocal<T>(key: string, update: (current: T) => T, fallback: T): T { const next = update(readStorage<T>(key, fallback)); writeStorage(key, next); return next }
function cloneDraft(draft: Draft): Draft { return { ...draft, tags: [...draft.tags], references: [...(draft.references || [])] } }
function slugify(value: string) { return normalizeSearchText(value).replace(/ /g, '-') }
function formatRevision(revision: Revision) {
  if (!revision.snapshot) return revision.content
  const snapshot = revision.snapshot
  const references = snapshot.references?.length ? `\n\nReferences:\n${snapshot.references.map((reference) => `- ${reference}`).join('\n')}` : ''
  return `# ${snapshot.title}\n\n${snapshot.summary}\n\nTopic: ${snapshot.topic}\n\nTags: ${snapshot.tags.join(', ')}\n\n${snapshot.content}${references}`
}
function addActivity(article: Article, type: ActivityEvent['type'], summary: string) {
  const now = new Date().toISOString()
  updateLocal<ActivityEvent[]>(STORAGE.activity, (items) => [{ id: crypto.randomUUID(), type, actor: article.author, articleSlug: article.slug, createdAt: now, summary }, ...items], sampleActivity)
  updateLocal<Notification[]>(STORAGE.notifications, (items) => [{ id: crypto.randomUUID(), title: type === 'article-created' ? 'A new article was published' : 'An article was updated', body: `${article.author}: ${article.title}`, createdAt: now }, ...items], sampleNotifications)
}

export const demoRepositories: DemoRepositories = {
  articles: {
    list(query = {}) {
      const q = normalizeSearchText(query.query || '')
      const sorted = currentArticles().filter((article) => (!query.topic || article.topic === query.topic) && (!q || matchesSearch(q, normalizeSearchText(`${article.title} ${article.summary} ${article.content} ${article.tags.join(' ')}`))))
      if (query.sort === 'reading') sorted.sort((a, b) => a.readingTime - b.readingTime)
      else if (query.sort === 'revisions') sorted.sort((a, b) => b.revisions - a.revisions)
      else sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      const offset = Math.max(0, Number(query.cursor) || 0)
      const limit = Math.max(1, query.limit || sorted.length || 1)
      return { items: sorted.slice(offset, offset + limit), nextCursor: offset + limit < sorted.length ? String(offset + limit) : undefined, total: sorted.length }
    },
    get(slug) { return currentArticles().find((article) => article.slug === slug) },
    async create(input) {
      const title = input.title.trim()
      const baseSlug = slugify(title) || 'untitled-article'
      const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`
      const now = new Date().toISOString()
      const article: Article = { ...input, title, tags: [...input.tags], references: [...(input.references || [])], id: crypto.randomUUID(), slug, author: 'Demo Contributor', updatedAt: now.slice(0, 10), readingTime: Math.max(1, Math.ceil(input.content.trim().split(/\s+/).filter(Boolean).length / 220)), revisions: 1 }
      updateLocal<Article[]>(STORAGE.articles, (items) => [article, ...items], articleFixtures)
      updateLocal<Revision[]>(STORAGE.revisions, (items) => [{ id: crypto.randomUUID(), articleId: slug, number: 1, author: article.author, createdAt: now, summary: 'First published this article', content: article.content, snapshot: { ...input, tags: [...input.tags], references: [...(input.references || [])] } }, ...items], [])
      addActivity(article, 'article-created', 'Published a new article')
      return article
    },
    async update(slug, input) {
      const existing = currentArticles().find((article) => article.slug === slug)
      if (!existing) throw new Error('Article not found')
      const now = new Date().toISOString()
      const next: Article = { ...existing, ...input, tags: [...input.tags], references: [...(input.references || [])], updatedAt: now.slice(0, 10), revisions: existing.revisions + 1, readingTime: Math.max(1, Math.ceil(input.content.trim().split(/\s+/).filter(Boolean).length / 220)) }
      updateLocal<Article[]>(STORAGE.articles, (items) => items.map((article) => article.slug === slug ? next : article), articleFixtures)
      const savedRevisions = currentRevisions()
      const initialRevision: Revision = { id: `${existing.slug}-r${existing.revisions}`, articleId: slug, number: existing.revisions, author: existing.author, createdAt: existing.updatedAt, summary: 'Existing demo article version', content: existing.content, snapshot: { title: existing.title, summary: existing.summary, topic: existing.topic, tags: existing.tags, content: existing.content, references: existing.references } }
      writeStorage(STORAGE.revisions, [{ id: crypto.randomUUID(), articleId: slug, number: next.revisions, author: 'Demo Contributor', createdAt: now, summary: 'Updated article content', content: next.content, snapshot: { ...input, tags: [...input.tags], references: [...(input.references || [])] } }, ...(savedRevisions.some((revision) => revision.articleId === slug) ? savedRevisions : [initialRevision, ...savedRevisions])])
      addActivity(next, 'article-updated', 'Updated an article')
      return next
    },
  },
  topics: { list: () => [...topicFixtures], get: (slug) => topicFixtures.find((topic) => topic.slug === slug) },
  contributors: {
    list: (query = {}) => { const offset = Math.max(0, Number(query.cursor) || 0); const items = contributorFixtures.slice(offset, offset + (query.limit || contributorFixtures.length)); return { items, total: contributorFixtures.length, nextCursor: offset + items.length < contributorFixtures.length ? String(offset + items.length) : undefined } },
    get: (username) => contributorFixtures.find((person) => person.username === username),
  },
  revisions: {
    list(articleId) {
      const stored = currentRevisions().filter((revision) => revision.articleId === articleId)
      if (stored.length) return stored.sort((a, b) => b.number - a.number)
      const article = currentArticles().find((item) => item.slug === articleId)
      if (!article) return []
      const firstContent = article.content.split(/\n\n##\s/)[0]
      return [{ id: `${article.slug}-r${article.revisions}`, articleId, number: article.revisions, author: article.author, createdAt: article.updatedAt, summary: 'Current published version', content: article.content, snapshot: { title: article.title, summary: article.summary, topic: article.topic, tags: article.tags, content: article.content, references: article.references } }, { id: `${article.slug}-r1`, articleId, number: 1, author: article.author, createdAt: article.updatedAt, summary: 'First published introduction', content: firstContent, snapshot: { title: article.title, summary: article.summary, topic: article.topic, tags: article.tags, content: firstContent, references: article.references } }]
    },
    compare(articleId, fromId, toId) { const versions = demoRepositories.revisions.list(articleId); const before = versions.find((version) => version.id === fromId); const after = versions.find((version) => version.id === toId); return before && after ? { before: formatRevision(before), after: formatRevision(after) } : undefined },
  },
  activity: { list(query = {}) { const items = currentActivity(); const offset = Math.max(0, Number(query.cursor) || 0); const page = items.slice(offset, offset + (query.limit || items.length || 1)); return { items: page, total: items.length, nextCursor: offset + page.length < items.length ? String(offset + page.length) : undefined } } },
  users: { getCurrent: async () => undefined, getByWallet: () => undefined },
  drafts: {
    list: () => readStorage<Draft[]>(STORAGE.drafts, []).map(cloneDraft),
    get: (id) => { const draft = readStorage<Draft[]>(STORAGE.drafts, []).find((item) => item.id === id); return draft ? cloneDraft(draft) : undefined },
    save(draft) { return writeStorage(STORAGE.drafts, updateLocal<Draft[]>(STORAGE.drafts, (items) => [{ ...draft, savedAt: new Date().toISOString(), tags: [...draft.tags], references: [...(draft.references || [])] }, ...items.filter((item) => item.id !== draft.id)], [])) },
    remove(id) { return writeStorage(STORAGE.drafts, readStorage<Draft[]>(STORAGE.drafts, []).filter((draft) => draft.id !== id)) },
  },
  bookmarks: {
    list: () => readStorage<Bookmark[]>(STORAGE.bookmarks, []).map((bookmark) => ({ ...bookmark })),
    has: (articleSlug) => readStorage<Bookmark[]>(STORAGE.bookmarks, []).some((bookmark) => bookmark.articleSlug === articleSlug),
    toggle(articleSlug) { const items = readStorage<Bookmark[]>(STORAGE.bookmarks, []); const next = items.some((item) => item.articleSlug === articleSlug) ? items.filter((item) => item.articleSlug !== articleSlug) : [...items, { articleSlug, savedAt: new Date().toISOString() }]; return writeStorage(STORAGE.bookmarks, next) },
  },
  preferences: { getTheme: () => readStorage<'light' | 'dark' | undefined>(STORAGE.theme, undefined), setTheme: (theme) => writeStorage(STORAGE.theme, theme) },
  notifications: {
    list: () => currentNotifications(),
    async markRead(id) { updateLocal<Notification[]>(STORAGE.notifications, (items) => items.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item), []) },
    async markAllRead() { const now = new Date().toISOString(); updateLocal<Notification[]>(STORAGE.notifications, (items) => items.map((item) => ({ ...item, readAt: item.readAt || now })), []) },
  },
}

export const demoDataMode = 'demo' as const
