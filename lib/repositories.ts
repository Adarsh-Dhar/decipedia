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
export type ArticleDraftInput = Pick<Article, 'title' | 'summary' | 'topic' | 'tags' | 'content'>

export type Topic = (typeof topicFixtures)[number]
export type Contributor = (typeof contributorFixtures)[number]
export type Revision = { id: string; articleId: string; number: number; author: string; createdAt: string; summary: string; transactionHash?: string }
export type ActivityEvent = { id: string; type: 'article-created' | 'article-updated' | 'revision-published'; actor: string; articleSlug: string; createdAt: string; summary: string }
export type UserProfile = { id: string; displayName: string; walletAddress?: string; bio?: string; avatarUrl?: string }
export type Draft = { id: string; title: string; summary: string; topic: string; tags: string[]; content: string; savedAt: string }
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
  articles: ArticleRepository
  topics: TopicRepository
  revisions: RevisionRepository
  contributors: ContributorRepository
  activity: ActivityRepository
  users: UserRepository
  drafts: DraftRepository
  bookmarks: BookmarkRepository
  preferences: PreferenceRepository
  notifications: NotificationRepository
}

type DemoArticleRepository = Omit<ArticleRepository, 'list' | 'get'> & { list(query?: SearchQuery): PageResult<Article>; get(slug: string): Article | undefined }
type DemoTopicRepository = Omit<TopicRepository, 'list' | 'get'> & { list(): Topic[]; get(slug: string): Topic | undefined }
type DemoContributorRepository = Omit<ContributorRepository, 'list' | 'get'> & { list(query?: PageQuery): PageResult<Contributor>; get(username: string): Contributor | undefined }
export type DemoRepositories = Omit<DecipediaRepositories, 'articles' | 'topics' | 'contributors'> & {
  articles: DemoArticleRepository
  topics: DemoTopicRepository
  contributors: DemoContributorRepository
}

const emptyPage = <T,>(items: T[] = []): PageResult<T> => ({ items, total: items.length })
function normalizeSearchText(value: string) { return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim() }
function matchesSearch(query: string, text: string) { return query.split(/\s+/).filter(Boolean).every((term) => text.includes(term)) }

let demoDrafts: Draft[] = []
let demoBookmarks: Bookmark[] = []
let demoTheme: 'light' | 'dark' | undefined

export const demoRepositories: DemoRepositories = {
  articles: {
    list(query = {}) {
      const q = normalizeSearchText(query.query || '')
      const sorted = articleFixtures.filter((article) => (!query.topic || article.topic === query.topic) && (!q || matchesSearch(q, normalizeSearchText(`${article.title} ${article.summary} ${article.content} ${article.tags.join(' ')}`))))
      if (query.sort === 'reading') sorted.sort((a, b) => a.readingTime - b.readingTime)
      else if (query.sort === 'revisions') sorted.sort((a, b) => b.revisions - a.revisions)
      else sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      const offset = Math.max(0, Number(query.cursor) || 0)
      const limit = Math.max(1, query.limit || sorted.length || 1)
      return { items: sorted.slice(offset, offset + limit), nextCursor: offset + limit < sorted.length ? String(offset + limit) : undefined, total: sorted.length }
    },
    get(slug) { return articleFixtures.find((article) => article.slug === slug) },
  },
  topics: { list: () => [...topicFixtures], get: (slug) => topicFixtures.find((topic) => topic.slug === slug) },
  contributors: {
    list: (query = {}) => emptyPage(contributorFixtures.slice(query.cursor ? Number(query.cursor) || 0 : 0, (Number(query.cursor) || 0) + (query.limit || contributorFixtures.length))),
    get: (username) => contributorFixtures.find((person) => person.username === username),
  },
  revisions: { list: () => [], compare: () => undefined },
  activity: { list: () => emptyPage<ActivityEvent>() },
  users: { getCurrent: async () => undefined, getByWallet: () => undefined },
  drafts: {
    list: () => demoDrafts.map((draft) => ({ ...draft, tags: [...draft.tags] })),
    get: (id) => { const draft = demoDrafts.find((item) => item.id === id); return draft ? { ...draft, tags: [...draft.tags] } : undefined },
    save(draft) { demoDrafts = [...demoDrafts.filter((item) => item.id !== draft.id), { ...draft, tags: [...draft.tags] }]; return true },
    remove(id) { demoDrafts = demoDrafts.filter((draft) => draft.id !== id); return true },
  },
  bookmarks: {
    list: () => demoBookmarks.map((bookmark) => ({ ...bookmark })),
    has: (articleSlug) => demoBookmarks.some((bookmark) => bookmark.articleSlug === articleSlug),
    toggle(articleSlug) { demoBookmarks = demoBookmarks.some((item) => item.articleSlug === articleSlug) ? demoBookmarks.filter((item) => item.articleSlug !== articleSlug) : [...demoBookmarks, { articleSlug, savedAt: new Date().toISOString() }]; return true },
  },
  preferences: {
    getTheme: () => demoTheme,
    setTheme(theme) { demoTheme = theme; return true },
  },
  notifications: { list: async () => [], markRead: async () => undefined, markAllRead: async () => undefined },
}

export const demoDataMode = 'demo' as const
