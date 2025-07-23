import { ethers } from 'ethers';

/**
 * Wait for a transaction to be mined, with a timeout (in ms).
 */
export async function waitForConfirmation(
  provider: ethers.providers.Provider,
  txHash: string,
  timeoutMs = 60000,
  pollIntervalMs = 3000
): Promise<ethers.providers.TransactionReceipt> {
  const start = Date.now();
  while (true) {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt && receipt.confirmations && receipt.confirmations > 0) {
      if (receipt.status === 1) return receipt;
      throw new Error('Transaction failed');
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error('Transaction confirmation timed out');
    }
    await new Promise(res => setTimeout(res, pollIntervalMs));
  }
}

/**
 * Poll for transaction status (returns status or throws on timeout/failure).
 */
export async function pollTransactionStatus(
  provider: ethers.providers.Provider,
  txHash: string,
  timeoutMs = 60000,
  pollIntervalMs = 3000
): Promise<'pending' | 'confirmed' | 'failed'> {
  const start = Date.now();
  while (true) {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt) {
      if (receipt.status === 1) return 'confirmed';
      return 'failed';
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error('Transaction confirmation timed out');
    }
    await new Promise(res => setTimeout(res, pollIntervalMs));
  }
} 