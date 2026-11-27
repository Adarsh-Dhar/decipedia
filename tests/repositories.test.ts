import { afterEach, describe, expect, it, vi } from 'vitest'
import { demoRepositories } from '../lib/repositories'

function installStorage() {
  const values = new Map<string, string>()
  const localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
    clear: () => values.clear(),
  }
  vi.stubGlobal('window', { localStorage })
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
    expect(demoRepositories.drafts.get('draft-1')).toEqual(draft)
    demoRepositories.drafts.remove('draft-1')
    expect(demoRepositories.drafts.get('draft-1')).toBeUndefined()
  })

  it('treats corrupt local draft data as empty', () => {
    const storage = installStorage()
    storage.setItem('deci-drafts', '{invalid')
    expect(demoRepositories.drafts.list()).toEqual([])
  })
})
