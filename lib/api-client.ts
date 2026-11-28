import 'server-only'
import { z } from 'zod'

export class ApiClientError extends Error {
  constructor(message: string, readonly status: number, readonly requestId?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ApiClientError'
  }
}

export interface AuthSessionProvider {
  getAccessToken(signal?: AbortSignal): Promise<string | undefined>
}

export type ApiRequestOptions<T> = {
  path: string
  schema: z.ZodType<T>
  init?: RequestInit
  auth?: AuthSessionProvider
  timeoutMs?: number
  allowNoContent?: boolean
}

export async function apiRequest<T>({ path, schema, init = {}, auth, timeoutMs = 12_000, allowNoContent = false }: ApiRequestOptions<T>): Promise<T> {
  const baseUrl = process.env.BACKEND_API_URL
  if (!baseUrl) throw new ApiClientError('API mode requires BACKEND_API_URL.', 503)

  let url: URL
  try {
    const base = new URL(baseUrl)
    if (base.username || base.password || (base.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(base.hostname))) throw new Error('The API base URL must use HTTPS and must not contain credentials.')
    url = new URL(path, base)
    if (url.origin !== base.origin) throw new Error('The request path must use the configured API origin.')
    url.hash = ''
  } catch (cause) {
    throw new ApiClientError('The configured API URL or request path is invalid.', 500, undefined, { cause })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new DOMException('Request timed out.', 'TimeoutError')), timeoutMs)
  const signals = [controller.signal, ...(init.signal ? [init.signal] : [])]
  const signal = AbortSignal.any(signals)

  try {
    const token = await auth?.getAccessToken(signal)
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')
    if (!headers.has('x-request-id')) headers.set('x-request-id', crypto.randomUUID())
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const response = await fetch(url, {
      ...init,
      cache: 'no-store',
      signal,
      headers,
    })
    const requestId = response.headers.get('x-request-id') || headers.get('x-request-id') || undefined
    if (!response.ok) {
      const message = response.status === 401 ? 'Authentication is required.'
        : response.status === 403 ? 'You are not allowed to perform this request.'
        : response.status === 429 ? 'Too many requests. Please try again later.'
        : `The request failed (${response.status}).`
      throw new ApiClientError(message, response.status, requestId)
    }
    if (response.status === 204 && allowNoContent) return undefined as T
    let body: unknown
    try { body = await response.json() } catch (cause) { throw new ApiClientError('The service returned invalid JSON.', 502, requestId, { cause }) }
    const parsed = schema.safeParse(body)
    if (!parsed.success) throw new ApiClientError('The service response did not match the expected contract.', 502, requestId, { cause: parsed.error })
    return parsed.data
  } catch (error) {
    if (error instanceof ApiClientError) throw error
    if (signal.aborted) {
      if (init.signal?.aborted) throw new ApiClientError('The request was cancelled.', 499, undefined, { cause: error })
      throw new ApiClientError('The request timed out. Please try again.', 408, undefined, { cause: error })
    }
    throw new ApiClientError('The knowledge service could not be reached.', 503, undefined, { cause: error })
  } finally {
    clearTimeout(timeout)
  }
}
