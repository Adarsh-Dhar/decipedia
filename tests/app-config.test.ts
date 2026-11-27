import { describe, expect, it } from 'vitest'
import { loadAppConfig } from '../lib/app-config'

describe('loadAppConfig', () => {
  it('defaults to demo mode only outside production and does not claim a default network', () => {
    const config = loadAppConfig({}, 'development')

    expect(config.dataMode).toBe('demo')
    expect(config.network).toBe('Network not configured')
    expect(config.networkConfigured).toBe(false)
  })

  it('requires an explicit mode in production', () => {
    expect(() => loadAppConfig({}, 'production')).toThrow('NEXT_PUBLIC_APP_DATA_MODE must be explicitly set in production.')
  })

  it('rejects unknown data modes instead of silently falling back to demo', () => {
    expect(() => loadAppConfig({ NEXT_PUBLIC_APP_DATA_MODE: 'staging' }, 'development'))
      .toThrow('Invalid Decipedia configuration: dataMode.')
  })

  it('normalizes optional Gno settings and reports the network ready only with chain and RPC', () => {
    const config = loadAppConfig({
      NEXT_PUBLIC_APP_DATA_MODE: 'api',
      BACKEND_API_URL: 'https://api.example.test',
      NEXT_PUBLIC_GNO_NETWORK_LABEL: 'Gno Testnet',
      NEXT_PUBLIC_GNO_RPC_URL: 'https://rpc.example.test',
      NEXT_PUBLIC_GNO_CHAIN_ID: 'gno-test-1',
      NEXT_PUBLIC_GNO_ARTICLE_REALM: 'gno.land/r/example/decipedia',
      NEXT_PUBLIC_GNOCONNECT_TX_DOMAINS: 'gno.land, gnoscan.io',
    }, 'development')

    expect(config.dataMode).toBe('api')
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
