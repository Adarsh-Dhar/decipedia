import { afterEach, describe, expect, it, vi } from 'vitest'
import { activateDemoStorage, demoRepositories } from '../lib/repositories'

function installStorage() {
  const values = new Map<string, string>()
  const localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
    clear: () => values.clear(),
  }
  vi.stubGlobal('window', { localStorage })
  activateDemoStorage()
  return localStorage
}

afterEach(() => vi.unstubAllGlobals())

describe('demo repositories', () => {
  it('filters articles and returns stable cursor pages', () => {
    const firstPage = demoRepositories.articles.list({ limit: 2 })
    expect(firstPage.items).toHaveLength(2)
    expect(firstPage.nextCursor).toBe('2')

    const secondPage = demoRepositories.articles.list({ cursor: firstPage.nextCursor, limit: 2 })
    expect(secondPage.items).toHaveLength(2)
    expect(secondPage.items[0].slug).not.toBe(firstPage.items[0].slug)
  })

  it('matches normalized multiword queries across article content and tags', () => {
    const results = demoRepositories.articles.list({ query: 'zero knowledge' })
    expect(results.items.some((article) => article.slug === 'understanding-zero-knowledge-proofs')).toBe(true)

    const taggedResults = demoRepositories.articles.list({ query: 'governance' })
    expect(taggedResults.items.length).toBeGreaterThan(0)
    expect(taggedResults.items.every((article) => `${article.title} ${article.summary} ${article.content} ${article.tags.join(' ')}`.toLowerCase().includes('governance'))).toBe(true)
  })

  it('persists and toggles bookmarks through the browser repository', () => {
    installStorage()
    demoRepositories.bookmarks.toggle('open-knowledge')
    expect(demoRepositories.bookmarks.has('open-knowledge')).toBe(true)
    expect(demoRepositories.bookmarks.list()).toHaveLength(1)
    demoRepositories.bookmarks.toggle('open-knowledge')
    expect(demoRepositories.bookmarks.has('open-knowledge')).toBe(false)
  })

  it('saves and retrieves drafts without exposing storage to UI components', () => {
    installStorage()
    const draft = { id: 'draft-1', title: 'A draft', summary: '', topic: 'Governance', tags: [], content: 'Notes', savedAt: '2026-11-27T00:00:00.000Z' }
    demoRepositories.drafts.save(draft)
    expect(demoRepositories.drafts.get('draft-1')).toMatchObject({ ...draft, savedAt: expect.any(String) })
    demoRepositories.drafts.remove('draft-1')
    expect(demoRepositories.drafts.get('draft-1')).toBeUndefined()
  })

  it('treats corrupt local draft data as empty', () => {
    const storage = installStorage()
    storage.setItem('deci-drafts', '{invalid')
    expect(demoRepositories.drafts.list()).toEqual([])
  })

  it('ships a substantial demo commons and ten contributors', () => {
    expect(demoRepositories.articles.list().total).toBeGreaterThanOrEqual(12)
    expect(demoRepositories.contributors.list().total).toBeGreaterThanOrEqual(10)
  })

  it('creates and edits demo articles with linked revision and activity history', async () => {
    installStorage()
    const input = { title: 'A guide to careful experiments', summary: 'A practical guide to testing ideas.', topic: 'Research', tags: ['Methods'], references: ['https://example.org/research-methods'], content: '## Start with a question\n\nWrite down what you expect to observe.' }
    const article = await demoRepositories.articles.create?.(input)
    expect(article).toBeDefined()
    const updated = await demoRepositories.articles.update?.(article!.slug, { ...input, content: `${input.content}\n\n## Record the result\n\nKeep observations alongside the method.` })
    expect(updated?.revisions).toBe(2)
    expect(updated?.references).toEqual(input.references)
    const history = demoRepositories.revisions.list(article!.slug)
    expect(history.map((revision) => revision.number)).toEqual([2, 1])
    const comparison = demoRepositories.revisions.compare(article!.slug, history[1].id, history[0].id)
    expect(comparison?.before).toContain(input.content)
    expect(comparison?.before).toContain(input.summary)
    expect(comparison?.after).toContain(updated?.summary)
    expect(comparison?.after).toContain(updated?.content)
    expect(demoRepositories.activity.list().items.some((event) => event.articleSlug === article!.slug)).toBe(true)
    expect(demoRepositories.notifications.list().some((notification) => notification.body.includes(article!.title))).toBe(true)
  })
})
