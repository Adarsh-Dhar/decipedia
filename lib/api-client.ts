import type { Article } from './decipedia'

export type ApiError = { status: number; message: string; requestId?: string }
export const endpoints = {
  articles: '/v1/articles', article: (slug: string) => `/v1/articles/${encodeURIComponent(slug)}`,
  revisions: (id: string) => `/v1/articles/${encodeURIComponent(id)}/revisions`, topics: '/v1/topics',
  contributors: '/v1/contributors', search: '/v1/search', activity: '/v1/activity', me: '/v1/me',
  saved: '/v1/me/saved', notifications: '/v1/notifications',
} as const

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = process.env.BACKEND_API_URL
  if (!baseUrl) throw { status: 503, message: 'API mode requires BACKEND_API_URL.' } satisfies ApiError
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)
  try {
    const response = await fetch(new URL(path, baseUrl), { ...init, signal: init.signal || controller.signal, headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers } })
    const requestId = response.headers.get('x-request-id') || undefined
    if (!response.ok) throw { status: response.status, message: response.status === 503 ? 'The knowledge service is temporarily unavailable.' : `The request failed (${response.status}).`, requestId } satisfies ApiError
    return await response.json() as T
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw { status: 408, message: 'The request timed out. Please try again.' } satisfies ApiError
    throw error
  } finally { clearTimeout(timeout) }
}

export interface ArticleRepository { list(query?: { q?: string; topic?: string }): Promise<Article[]>; get(slug: string): Promise<Article> }
export class HttpArticleRepository implements ArticleRepository {
  list(query: { q?: string; topic?: string } = {}) { const params = new URLSearchParams(Object.entries(query).filter((entry): entry is [string, string] => Boolean(entry[1]))); return apiRequest<Article[]>(`${endpoints.articles}${params.size ? `?${params}` : ''}`) }
  get(slug: string) { return apiRequest<Article>(endpoints.article(slug)) }
}
