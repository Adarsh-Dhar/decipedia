import { describe, expect, it } from 'vitest'
import { loadAppConfig } from '../lib/app-config'

describe('loadAppConfig', () => {
  it('defaults to demo content and detects configured Supabase accounts', () => {
    const config = loadAppConfig({
      NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    }, 'development')

    expect(config.contentMode).toBe('demo')
    expect(config.accountMode).toBe('supabase')
    expect(config.supabaseConfigured).toBe(true)
    expect(config.network).toBe('Network not configured')
    expect(config.networkConfigured).toBe(false)
  })

  it('requires an explicit content mode in production', () => {
    expect(() => loadAppConfig({}, 'production')).toThrow('NEXT_PUBLIC_CONTENT_MODE must be explicitly set in production.')
  })

  it('rejects unknown content and account modes', () => {
    expect(() => loadAppConfig({ NEXT_PUBLIC_CONTENT_MODE: 'staging' }, 'development'))
      .toThrow('Invalid Decipedia configuration: contentMode.')
    expect(() => loadAppConfig({ NEXT_PUBLIC_ACCOUNT_MODE: 'remote' }, 'development'))
      .toThrow('Invalid Decipedia configuration: accountMode.')
  })

  it('supports demo content with Supabase accounts independently from API configuration', () => {
    const config = loadAppConfig({
      NEXT_PUBLIC_CONTENT_MODE: 'demo',
      NEXT_PUBLIC_ACCOUNT_MODE: 'supabase',
      NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
      BACKEND_API_URL: 'https://api.example.test',
      NEXT_PUBLIC_GNO_NETWORK_LABEL: 'Gno Testnet',
      NEXT_PUBLIC_GNO_RPC_URL: 'https://rpc.example.test',
      NEXT_PUBLIC_GNO_CHAIN_ID: 'gno-test-1',
      NEXT_PUBLIC_GNO_ARTICLE_REALM: 'gno.land/r/example/decipedia',
      NEXT_PUBLIC_GNOCONNECT_TX_DOMAINS: 'gno.land, gnoscan.io',
    }, 'development')

    expect(config.contentMode).toBe('demo')
    expect(config.accountMode).toBe('supabase')
    expect(config.supabaseConfigured).toBe(true)
    expect(config.backendApiConfigured).toBe(true)
    expect(config.apiBaseUrlConfigured).toBe(true)
    expect(config.network).toBe('Gno Testnet')
    expect(config.networkConfigured).toBe(true)
    expect(config.transactionDomains).toEqual(['gno.land', 'gnoscan.io'])
  })

  it('rejects malformed URLs', () => {
    expect(() => loadAppConfig({ BACKEND_API_URL: 'not-a-url' }, 'development'))
      .toThrow('Invalid Decipedia configuration: backendApiUrl.')
  })
})
