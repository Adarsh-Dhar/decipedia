import { z } from 'zod'

const optionalUrl = z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
  z.string().url().optional(),
)

const configSchema = z.object({
  dataMode: z.enum(['demo', 'api']),
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
  const configuredMode = env.NEXT_PUBLIC_APP_DATA_MODE?.trim()
  if (nodeEnv === 'production' && !configuredMode) {
    throw new Error('NEXT_PUBLIC_APP_DATA_MODE must be explicitly set in production.')
  }

  const result = configSchema.safeParse({
    dataMode: configuredMode || 'demo',
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
    dataMode: config.dataMode,
    apiBaseUrlConfigured: Boolean(config.backendApiUrl),
    network: config.networkLabel || 'Network not configured',
    networkConfigured: Boolean(config.rpcUrl && config.chainId),
    rpcUrl: config.rpcUrl,
    chainId: config.chainId,
    articleRealm: config.articleRealm,
    transactionDomains: config.transactionDomains,
  } as const
}

export const appConfig = loadAppConfig(process.env, process.env.NODE_ENV)
