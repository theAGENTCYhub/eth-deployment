import { ethers } from 'ethers';

/**
 * Generate a fresh wallet for bundle operations
 */
export function generateBundleWallet(): { address: string; privateKey: string } {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey
  };
}

/**
 * Sign a transaction with a private key
 */
export async function signTransaction(
  transaction: ethers.PopulatedTransaction | ethers.providers.TransactionRequest,
  privateKey: string
): Promise<string> {
  const wallet = new ethers.Wallet(privateKey);
  return await wallet.signTransaction(transaction);
}

/**
 * Get the next nonce for a wallet
 */
export async function getNextNonce(provider: ethers.providers.Provider, address: string): Promise<number> {
  return await provider.getTransactionCount(address, 'latest');
}

/**
 * Calculate gas estimate for a transaction
 */
export async function estimateGas(
  provider: ethers.providers.Provider,
  transaction: ethers.PopulatedTransaction | ethers.providers.TransactionRequest
): Promise<ethers.BigNumber> {
  return await provider.estimateGas(transaction);
}

/**
 * Get current gas price
 */
export async function getGasPrice(provider: ethers.providers.Provider): Promise<ethers.BigNumber> {
  return await provider.getGasPrice();
}

/**
 * Calculate deadline timestamp (current time + minutes)
 */
export function calculateDeadline(minutes: number = 60): number {
  return Math.floor(Date.now() / 1000) + (minutes * 60);
}

/**
 * Format transaction for display
 */
export function formatTransaction(tx: ethers.PopulatedTransaction | ethers.providers.TransactionRequest): string {
  return {
    to: tx.to,
    value: tx.value?.toString(),
    data: tx.data,
    nonce: tx.nonce,
    gasLimit: tx.gasLimit?.toString(),
    gasPrice: tx.gasPrice?.toString()
  } as any;
} 