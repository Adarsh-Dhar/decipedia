import { z } from 'zod'

const optionalUrl = z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
  z.string().url().optional(),
)

const configSchema = z.object({
  contentMode: z.enum(['demo', 'api']),
  accountMode: z.enum(['local', 'supabase']),
  supabaseUrl: optionalUrl,
  supabasePublishableKey: z.string().trim().min(1).optional(),
  backendApiUrl: optionalUrl,
  networkLabel: z.string().trim().min(1).optional(),
  rpcUrl: optionalUrl,
  chainId: z.string().trim().min(1).optional(),
  articleRealm: z.string().trim().min(1).optional(),
  transactionDomains: z.array(z.string().trim().min(1)),
})

export function loadAppConfig(
  env: Record<string, string | undefined>,
  nodeEnv = 'development',
) {
  const configuredContentMode = env.NEXT_PUBLIC_CONTENT_MODE?.trim()
  if (nodeEnv === 'production' && !configuredContentMode) {
    throw new Error('NEXT_PUBLIC_CONTENT_MODE must be explicitly set in production.')
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim() || undefined
  const supabasePublishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || undefined
  const result = configSchema.safeParse({
    contentMode: configuredContentMode || 'demo',
    accountMode: env.NEXT_PUBLIC_ACCOUNT_MODE?.trim() || (supabaseUrl && supabasePublishableKey ? 'supabase' : 'local'),
    supabaseUrl,
    supabasePublishableKey,
    backendApiUrl: env.BACKEND_API_URL,
    networkLabel: env.NEXT_PUBLIC_GNO_NETWORK_LABEL?.trim() || undefined,
    rpcUrl: env.NEXT_PUBLIC_GNO_RPC_URL,
    chainId: env.NEXT_PUBLIC_GNO_CHAIN_ID,
    articleRealm: env.NEXT_PUBLIC_GNO_ARTICLE_REALM,
    transactionDomains: (env.NEXT_PUBLIC_GNOCONNECT_TX_DOMAINS || '')
      .split(',')
      .map((domain) => domain.trim())
      .filter(Boolean),
  })

  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))]
    throw new Error(`Invalid Decipedia configuration: ${fields.join(', ')}.`)
  }

  const config = result.data
  return {
    name: 'Decipedia',
    contentMode: config.contentMode,
    accountMode: config.accountMode,
    supabaseConfigured: Boolean(config.supabaseUrl && config.supabasePublishableKey),
    backendApiConfigured: Boolean(config.backendApiUrl),
    apiBaseUrlConfigured: Boolean(config.backendApiUrl),
    network: config.networkLabel || 'Network not configured',
    networkConfigured: Boolean(config.rpcUrl && config.chainId),
    rpcUrl: config.rpcUrl,
    chainId: config.chainId,
    articleRealm: config.articleRealm,
    transactionDomains: config.transactionDomains,
  } as const
}

export const appConfig = loadAppConfig({
  NEXT_PUBLIC_CONTENT_MODE: process.env.NEXT_PUBLIC_CONTENT_MODE,
  NEXT_PUBLIC_ACCOUNT_MODE: process.env.NEXT_PUBLIC_ACCOUNT_MODE,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_GNO_NETWORK_LABEL: process.env.NEXT_PUBLIC_GNO_NETWORK_LABEL,
  NEXT_PUBLIC_GNO_RPC_URL: process.env.NEXT_PUBLIC_GNO_RPC_URL,
  NEXT_PUBLIC_GNO_CHAIN_ID: process.env.NEXT_PUBLIC_GNO_CHAIN_ID,
  NEXT_PUBLIC_GNO_ARTICLE_REALM: process.env.NEXT_PUBLIC_GNO_ARTICLE_REALM,
  NEXT_PUBLIC_GNOCONNECT_TX_DOMAINS: process.env.NEXT_PUBLIC_GNOCONNECT_TX_DOMAINS,
  BACKEND_API_URL: process.env.BACKEND_API_URL,
}, process.env.NODE_ENV)
