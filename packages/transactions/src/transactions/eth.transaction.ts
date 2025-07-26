import { ethers, BigNumber, Signer } from 'ethers';
import type { ServiceResponse } from '../types';

/**
 * ETH Transaction Builder
 * All values (amount, gas, etc.) must be provided in smallest units (wei).
 */
export async function buildEthTransferTx({ signer, to, amount, nonce, gasLimit, gasPrice }: {
  signer: Signer,
  to: string,
  amount: BigNumber | string | number,
  nonce?: number,
  gasLimit?: BigNumber | string | number,
  gasPrice?: BigNumber | string | number
}): Promise<ServiceResponse<{ tx: ethers.providers.TransactionRequest }>> {
  try {
    const tx: ethers.providers.TransactionRequest = {
      to,
      value: BigNumber.from(amount),
      nonce,
      gasLimit: gasLimit !== undefined ? BigNumber.from(gasLimit) : undefined,
      gasPrice: gasPrice !== undefined ? BigNumber.from(gasPrice) : undefined
    };
    return { success: true, data: { tx } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
} 