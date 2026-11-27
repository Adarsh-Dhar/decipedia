export type NetworkInfo = { chainId: string; rpcUrl?: string; label: string }
export type TransactionState = 'not-connected' | 'wrong-network' | 'ready' | 'awaiting-confirmation' | 'submitted' | 'pending' | 'confirmed' | 'failed' | 'rejected' | 'expired'
export type TransactionResult = { state: TransactionState; hash?: string; explorerUrl?: string; message?: string }
export interface WalletAdapter {
  isAvailable(): boolean
  connect(): Promise<{ address: string; network: NetworkInfo }>
  getAddress(): Promise<string | null>
  getNetwork(): Promise<NetworkInfo | null>
  submitTransaction(uri: string): Promise<TransactionResult>
  disconnect(): Promise<void>
}
export const networkConfig: NetworkInfo = {
  chainId: process.env.NEXT_PUBLIC_GNO_CHAIN_ID || '',
  rpcUrl: process.env.NEXT_PUBLIC_GNO_RPC_URL,
  label: process.env.NEXT_PUBLIC_GNO_NETWORK_LABEL || 'Gno.land testnet',
}
export const transactionDomains = (process.env.NEXT_PUBLIC_GNOCONNECT_TX_DOMAINS || '').split(',').map((item) => item.trim()).filter(Boolean)
