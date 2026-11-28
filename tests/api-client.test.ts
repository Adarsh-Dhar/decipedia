import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ApiClientError, apiRequest } from '../lib/api-client'

const responseSchema = z.object({ ok: z.boolean(), method: z.string().optional() })

function mockResponse(body: string, status = 200, headers?: HeadersInit) {
  return new Response(body, { status, headers })
}

beforeEach(() => {
  process.env.BACKEND_API_URL = 'https://api.decipedia.test/v1/'
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  delete process.env.BACKEND_API_URL
})

describe('apiRequest', () => {
  it('sends validated GET requests with correlation IDs', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse('{"ok":true}', 200, { 'x-request-id': 'backend-123' }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiRequest({ path: 'articles', schema: responseSchema })
    const [, request] = fetchMock.mock.calls[0] as [URL, RequestInit]
    const headers = new Headers(request.headers)
    expect(result).toEqual({ ok: true })
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://api.decipedia.test/v1/articles')
    expect(headers.get('accept')).toBe('application/json')
    expect(headers.get('x-request-id')).toBeTruthy()
  })

  it('sends JSON POST bodies and forwards bearer authentication', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse('{"ok":true,"method":"POST"}'))
    vi.stubGlobal('fetch', fetchMock)
    const auth = { getAccessToken: vi.fn().mockResolvedValue('signed-token') }

    const result = await apiRequest({
      path: 'articles',
      schema: responseSchema,
      init: { method: 'POST', body: JSON.stringify({ title: 'Example' }) },
      auth,
    })
    const request = fetchMock.mock.calls[0][1] as RequestInit
    const headers = new Headers(request.headers)
    expect(result).toEqual({ ok: true, method: 'POST' })
    expect(auth.getAccessToken).toHaveBeenCalledOnce()
    expect(headers.get('authorization')).toBe('Bearer signed-token')
    expect(headers.get('content-type')).toBe('application/json')
  })

  it.each([400, 401, 403, 404, 429, 500])('normalizes HTTP %i responses and keeps request IDs', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse('{"secret":"not surfaced"}', status, { 'x-request-id': 'trace-456' })))
    await expect(apiRequest({ path: 'articles', schema: responseSchema })).rejects.toMatchObject({
      name: 'ApiClientError', status, requestId: 'trace-456',
    })
  })

  it('reports invalid JSON and schema mismatches as upstream contract errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockResponse('not-json')).mockResolvedValueOnce(mockResponse('{"ok":"yes"}')))
    await expect(apiRequest({ path: 'articles', schema: responseSchema })).rejects.toMatchObject({ status: 502, message: 'The service returned invalid JSON.' })
    await expect(apiRequest({ path: 'articles', schema: responseSchema })).rejects.toMatchObject({ status: 502, message: 'The service response did not match the expected contract.' })
  })

  it('accepts an explicit empty 204 response for mutation endpoints', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
    await expect(apiRequest({ path: 'articles/example', schema: z.undefined(), init: { method: 'DELETE' }, allowNoContent: true })).resolves.toBeUndefined()
  })

  it('maps explicit cancellation without treating it as a timeout', async () => {
    const controller = new AbortController()
    controller.abort()
    vi.stubGlobal('fetch', vi.fn())
    await expect(apiRequest({ path: 'articles', schema: responseSchema, init: { signal: controller.signal } })).rejects.toMatchObject({ status: 499 })
  })

  it('maps timeout aborts consistently', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: URL, init: RequestInit) => new Promise((_, reject) => {
      init.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true })
    })))
    await expect(apiRequest({ path: 'articles', schema: responseSchema, timeoutMs: 1 })).rejects.toMatchObject({ status: 408 })
  })

  it('rejects requests that escape the configured origin', async () => {
    await expect(apiRequest({ path: 'https://other.example/articles', schema: responseSchema })).rejects.toBeInstanceOf(ApiClientError)
  })
})
