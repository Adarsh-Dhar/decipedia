export const appConfig = {
  name: 'Decipedia',
  dataMode: process.env.NEXT_PUBLIC_APP_DATA_MODE === 'api' ? 'api' : 'demo',
  apiBaseUrlConfigured: Boolean(process.env.BACKEND_API_URL),
  network: process.env.NEXT_PUBLIC_GNO_NETWORK_LABEL || 'Gno.land testnet',
  rpcUrl: process.env.NEXT_PUBLIC_GNO_RPC_URL,
  chainId: process.env.NEXT_PUBLIC_GNO_CHAIN_ID,
  articleRealm: process.env.NEXT_PUBLIC_GNO_ARTICLE_REALM,
  transactionDomains: (process.env.NEXT_PUBLIC_GNOCONNECT_TX_DOMAINS || '').split(',').map((domain) => domain.trim()).filter(Boolean),
} as const
