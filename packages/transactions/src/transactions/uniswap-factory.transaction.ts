import { ethers, BigNumber, Signer } from 'ethers';
import { UniswapV2Factory } from '../contracts/uniswap-v2-factory';
import type { ServiceResponse } from '../types';

/**
 * Uniswap V2 Create Pair Transaction Builder
 * All values (gas, etc.) must be provided in smallest units (wei).
 */
export async function buildUniswapCreatePairTx({ signer, tokenA, tokenB, nonce, gasLimit, gasPrice, network }: {
  signer: Signer,
  tokenA: string,
  tokenB: string,
  nonce?: number,
  gasLimit?: BigNumber | string | number,
  gasPrice?: BigNumber | string | number,
  network?: string
}): Promise<ServiceResponse<{ tx: ethers.PopulatedTransaction }>> {
  try {
    const factory = new UniswapV2Factory(signer, network);
    const tx = await factory.contract.populateTransaction.createPair(tokenA, tokenB);
    if (nonce !== undefined) tx.nonce = nonce;
    if (gasLimit !== undefined) tx.gasLimit = BigNumber.from(gasLimit);
    if (gasPrice !== undefined) tx.gasPrice = BigNumber.from(gasPrice);
    return { success: true, data: { tx } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
} 