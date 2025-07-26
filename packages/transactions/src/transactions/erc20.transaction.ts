import { ethers, BigNumber, Signer } from 'ethers';
import { ERC20_ABI } from '../contracts/erc20';
import { CUSTOM_ERC20_ABI } from '../contracts/custom-erc20';
import { getContractAddress } from '../contracts/contract-store';
import type { ServiceResponse } from '../types';

/**
 * ERC20 Transaction Builders
 * All values (amount, gas, etc.) must be provided in smallest units (wei).
 */
export async function buildERC20TransferTx({ signer, tokenAddress, to, amount, nonce, gasLimit, gasPrice }: {
  signer: Signer,
  tokenAddress: string,
  to: string,
  amount: BigNumber | string | number,
  nonce?: number,
  gasLimit?: BigNumber | string | number,
  gasPrice?: BigNumber | string | number
}): Promise<ServiceResponse<{ tx: ethers.PopulatedTransaction }>> {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const tx = await contract.populateTransaction.transfer(to, amount);
    if (nonce !== undefined) tx.nonce = nonce;
    if (gasLimit !== undefined) tx.gasLimit = BigNumber.from(gasLimit);
    if (gasPrice !== undefined) tx.gasPrice = BigNumber.from(gasPrice);
    return { success: true, data: { tx } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function buildERC20ApproveTx({ signer, tokenAddress, spender, amount, nonce, gasLimit, gasPrice }: {
  signer: Signer,
  tokenAddress: string,
  spender: string,
  amount: BigNumber | string | number,
  nonce?: number,
  gasLimit?: BigNumber | string | number,
  gasPrice?: BigNumber | string | number
}): Promise<ServiceResponse<{ tx: ethers.PopulatedTransaction }>> {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const tx = await contract.populateTransaction.approve(spender, amount);
    if (nonce !== undefined) tx.nonce = nonce;
    if (gasLimit !== undefined) tx.gasLimit = BigNumber.from(gasLimit);
    if (gasPrice !== undefined) tx.gasPrice = BigNumber.from(gasPrice);
    return { success: true, data: { tx } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Build transaction to transfer clog tokens from dev wallet to contract
 */
export async function buildClogTransferTx({ signer, tokenAddress, to, amount, nonce, gasLimit, gasPrice }: {
  signer: Signer,
  tokenAddress: string,
  to: string,
  amount: BigNumber | string | number,
  nonce?: number,
  gasLimit?: BigNumber | string | number,
  gasPrice?: BigNumber | string | number
}): Promise<ServiceResponse<{ tx: ethers.PopulatedTransaction }>> {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const tx = await contract.populateTransaction.transfer(to, amount);
    if (nonce !== undefined) tx.nonce = nonce;
    if (gasLimit !== undefined) tx.gasLimit = BigNumber.from(gasLimit);
    if (gasPrice !== undefined) tx.gasPrice = BigNumber.from(gasPrice);
    return { success: true, data: { tx } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}



/**
 * Build transaction to approve Uniswap Router for token spending
 */
export async function buildApproveRouterTx({ signer, tokenAddress, amount, nonce, gasLimit, gasPrice, network }: {
  signer: Signer,
  tokenAddress: string,
  amount: BigNumber | string | number,
  nonce?: number,
  gasLimit?: BigNumber | string | number,
  gasPrice?: BigNumber | string | number,
  network?: string
}): Promise<ServiceResponse<{ tx: ethers.PopulatedTransaction }>> {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const routerAddress = getContractAddress('UniswapV2Router02', network);
    if (!routerAddress) {
      return { success: false, error: 'Router address not found for network' };
    }
    const tx = await contract.populateTransaction.approve(routerAddress, amount);
    if (nonce !== undefined) tx.nonce = nonce;
    if (gasLimit !== undefined) tx.gasLimit = BigNumber.from(gasLimit);
    if (gasPrice !== undefined) tx.gasPrice = BigNumber.from(gasPrice);
    return { success: true, data: { tx } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Build transaction to open trading on custom ERC20 contract
 */
export async function buildOpenTradingTx({ signer, tokenAddress, nonce, gasLimit, gasPrice }: {
  signer: Signer,
  tokenAddress: string,
  nonce?: number,
  gasLimit?: BigNumber | string | number,
  gasPrice?: BigNumber | string | number
}): Promise<ServiceResponse<{ tx: ethers.PopulatedTransaction }>> {
  try {
    const contract = new ethers.Contract(tokenAddress, CUSTOM_ERC20_ABI, signer);
    const tx = await contract.populateTransaction.openTrading();
    if (nonce !== undefined) tx.nonce = nonce;
    if (gasLimit !== undefined) tx.gasLimit = BigNumber.from(gasLimit);
    if (gasPrice !== undefined) tx.gasPrice = BigNumber.from(gasPrice);
    return { success: true, data: { tx } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Build transaction to open trading V2 (simplified version without automatic liquidity)
 */
export async function buildOpenTradingV2Tx({ signer, tokenAddress, nonce, gasLimit, gasPrice }: {
  signer: Signer,
  tokenAddress: string,
  nonce?: number,
  gasLimit?: BigNumber | string | number,
  gasPrice?: BigNumber | string | number
}): Promise<ServiceResponse<{ tx: ethers.PopulatedTransaction }>> {
  try {
    const contract = new ethers.Contract(tokenAddress, CUSTOM_ERC20_ABI, signer);
    const tx = await contract.populateTransaction.openTradingV2();
    if (nonce !== undefined) tx.nonce = nonce;
    if (gasLimit !== undefined) tx.gasLimit = BigNumber.from(gasLimit);
    if (gasPrice !== undefined) tx.gasPrice = BigNumber.from(gasPrice);
    return { success: true, data: { tx } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Build transaction to exclude wallet from fees
 */
export async function buildExcludeFromFeeTx({ signer, tokenAddress, walletAddress, nonce, gasLimit, gasPrice }: {
  signer: Signer,
  tokenAddress: string,
  walletAddress: string,
  nonce?: number,
  gasLimit?: BigNumber | string | number,
  gasPrice?: BigNumber | string | number
}): Promise<ServiceResponse<{ tx: ethers.PopulatedTransaction }>> {
  try {
    const contract = new ethers.Contract(tokenAddress, CUSTOM_ERC20_ABI, signer);
    const tx = await contract.populateTransaction.excludeFromFee(walletAddress);
    if (nonce !== undefined) tx.nonce = nonce;
    if (gasLimit !== undefined) tx.gasLimit = BigNumber.from(gasLimit);
    if (gasPrice !== undefined) tx.gasPrice = BigNumber.from(gasPrice);
    return { success: true, data: { tx } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Build transaction to include wallet in fees
 */
export async function buildIncludeInFeeTx({ signer, tokenAddress, walletAddress, nonce, gasLimit, gasPrice }: {
  signer: Signer,
  tokenAddress: string,
  walletAddress: string,
  nonce?: number,
  gasLimit?: BigNumber | string | number,
  gasPrice?: BigNumber | string | number
}): Promise<ServiceResponse<{ tx: ethers.PopulatedTransaction }>> {
  try {
    const contract = new ethers.Contract(tokenAddress, CUSTOM_ERC20_ABI, signer);
    const tx = await contract.populateTransaction.includeInFee(walletAddress);
    if (nonce !== undefined) tx.nonce = nonce;
    if (gasLimit !== undefined) tx.gasLimit = BigNumber.from(gasLimit);
    if (gasPrice !== undefined) tx.gasPrice = BigNumber.from(gasPrice);
    return { success: true, data: { tx } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Check if wallet is excluded from fees (view function - no transaction needed)
 */
export async function checkIsExcludedFromFee({ signer, tokenAddress, walletAddress }: {
  signer: Signer,
  tokenAddress: string,
  walletAddress: string
}): Promise<ServiceResponse<{ isExcluded: boolean }>> {
  try {
    const contract = new ethers.Contract(tokenAddress, CUSTOM_ERC20_ABI, signer);
    const isExcluded = await contract.isExcludedFromFee(walletAddress);
    return { success: true, data: { isExcluded } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
} 