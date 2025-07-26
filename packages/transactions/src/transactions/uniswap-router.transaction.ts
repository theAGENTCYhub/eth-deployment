import { ethers, BigNumber, Signer } from 'ethers';
import { UniswapV2Router } from '../contracts/uniswap-v2-router';
import type { ServiceResponse } from '../types';

/**
 * Uniswap V2 Add Liquidity Transaction Builder
 * All values (amounts, gas, etc.) must be provided in smallest units (wei).
 */
export async function buildUniswapAddLiquidityTx({ signer, tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline, nonce, gasLimit, gasPrice, network }: {
  signer: Signer,
  tokenA: string,
  tokenB: string,
  amountADesired: BigNumber | string | number,
  amountBDesired: BigNumber | string | number,
  amountAMin: BigNumber | string | number,
  amountBMin: BigNumber | string | number,
  to: string,
  deadline: number,
  nonce?: number,
  gasLimit?: BigNumber | string | number,
  gasPrice?: BigNumber | string | number,
  network?: string
}): Promise<ServiceResponse<{ tx: ethers.PopulatedTransaction }>> {
  try {
    const router = new UniswapV2Router(signer, network);
    const tx = await router.contract.populateTransaction.addLiquidity(
      tokenA,
      tokenB,
      BigNumber.from(amountADesired),
      BigNumber.from(amountBDesired),
      BigNumber.from(amountAMin),
      BigNumber.from(amountBMin),
      to,
      deadline
    );
    if (nonce !== undefined) tx.nonce = nonce;
    if (gasLimit !== undefined) tx.gasLimit = BigNumber.from(gasLimit);
    if (gasPrice !== undefined) tx.gasPrice = BigNumber.from(gasPrice);
    return { success: true, data: { tx } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Uniswap V2 Remove Liquidity Transaction Builder
 * All values (amounts, gas, etc.) must be provided in smallest units (wei).
 */
export async function buildUniswapRemoveLiquidityTx({ signer, tokenA, tokenB, liquidity, amountAMin, amountBMin, to, deadline, nonce, gasLimit, gasPrice, network }: {
  signer: Signer,
  tokenA: string,
  tokenB: string,
  liquidity: BigNumber | string | number,
  amountAMin: BigNumber | string | number,
  amountBMin: BigNumber | string | number,
  to: string,
  deadline: number,
  nonce?: number,
  gasLimit?: BigNumber | string | number,
  gasPrice?: BigNumber | string | number,
  network?: string
}): Promise<ServiceResponse<{ tx: ethers.PopulatedTransaction }>> {
  try {
    const router = new UniswapV2Router(signer, network);
    const tx = await router.contract.populateTransaction.removeLiquidity(
      tokenA,
      tokenB,
      BigNumber.from(liquidity),
      BigNumber.from(amountAMin),
      BigNumber.from(amountBMin),
      to,
      deadline
    );
    if (nonce !== undefined) tx.nonce = nonce;
    if (gasLimit !== undefined) tx.gasLimit = BigNumber.from(gasLimit);
    if (gasPrice !== undefined) tx.gasPrice = BigNumber.from(gasPrice);
    return { success: true, data: { tx } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Uniswap V2 Swap Transaction Builder
 * All values (amounts, gas, etc.) must be provided in smallest units (wei).
 * Supports both swapExactETHForTokens and swapExactTokensForETH.
 * @param direction 'ethToToken' | 'tokenToEth' | 'buy' | 'sell'
 */
export async function buildUniswapSwapTx({ signer, path, amountIn, amountOutMin, to, deadline, direction, nonce, gasLimit, gasPrice, network }: {
  signer: Signer,
  path: string[],
  amountIn: BigNumber | string | number,
  amountOutMin: BigNumber | string | number,
  to: string,
  deadline: number,
  direction: 'ethToToken' | 'tokenToEth' | 'buy' | 'sell',
  nonce?: number,
  gasLimit?: BigNumber | string | number,
  gasPrice?: BigNumber | string | number,
  network?: string
}): Promise<ServiceResponse<{ tx: ethers.PopulatedTransaction }>> {
  // Accept 'buy' as alias for 'ethToToken', 'sell' as alias for 'tokenToEth'
  const actualDirection = direction === 'buy' ? 'ethToToken' : direction === 'sell' ? 'tokenToEth' : direction;
  try {
    const router = new UniswapV2Router(signer, network);
    let tx;
    if (actualDirection === 'ethToToken') {
      tx = await router.contract.populateTransaction.swapExactETHForTokens(
        BigNumber.from(amountOutMin),
        path,
        to,
        deadline,
        { value: BigNumber.from(amountIn) }
      );
    } else {
      tx = await router.contract.populateTransaction.swapExactTokensForETH(
        BigNumber.from(amountIn),
        BigNumber.from(amountOutMin),
        path,
        to,
        deadline
      );
    }
    if (nonce !== undefined) tx.nonce = nonce;
    if (gasLimit !== undefined) tx.gasLimit = BigNumber.from(gasLimit);
    if (gasPrice !== undefined) tx.gasPrice = BigNumber.from(gasPrice);
    return { success: true, data: { tx } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Wrapper: Buy token with ETH (swapExactETHForTokens)
 */
export async function buyTokenWithEth(params: Omit<Parameters<typeof buildUniswapSwapTx>[0], 'direction'>) {
  return buildUniswapSwapTx({ ...params, direction: 'buy' });
}

/**
 * Wrapper: Sell token for ETH (swapExactTokensForETH)
 */
export async function sellTokenForEth(params: Omit<Parameters<typeof buildUniswapSwapTx>[0], 'direction'>) {
  return buildUniswapSwapTx({ ...params, direction: 'sell' });
}

/**
 * Static call: getAmountsOut
 * Returns the output amounts for a given input amount and path.
 */
export async function getAmountsOut({ provider, amountIn, path, network }: {
  provider: ethers.providers.Provider,
  amountIn: BigNumber | string | number,
  path: string[],
  network?: string
}): Promise<ServiceResponse<{ amounts: BigNumber[] }>> {
  try {
    const router = new UniswapV2Router(provider, network);
    const amounts: BigNumber[] = await router.contract.getAmountsOut(BigNumber.from(amountIn), path);
    return { success: true, data: { amounts } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Static call: getAmountsIn
 * Returns the input amounts for a given output amount and path.
 */
export async function getAmountsIn({ provider, amountOut, path, network }: {
  provider: ethers.providers.Provider,
  amountOut: BigNumber | string | number,
  path: string[],
  network?: string
}): Promise<ServiceResponse<{ amounts: BigNumber[] }>> {
  try {
    const router = new UniswapV2Router(provider, network);
    const amounts: BigNumber[] = await router.contract.getAmountsIn(BigNumber.from(amountOut), path);
    return { success: true, data: { amounts } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Static call: quote
 * Returns the amount of tokenB received for a given amount of tokenA and reserves.
 */
export async function quote({ provider, amountA, reserveA, reserveB, network }: {
  provider: ethers.providers.Provider,
  amountA: BigNumber | string | number,
  reserveA: BigNumber | string | number,
  reserveB: BigNumber | string | number,
  network?: string
}): Promise<ServiceResponse<{ amountB: BigNumber }>> {
  try {
    const router = new UniswapV2Router(provider, network);
    const amountB: BigNumber = await router.contract.quote(
      BigNumber.from(amountA),
      BigNumber.from(reserveA),
      BigNumber.from(reserveB)
    );
    return { success: true, data: { amountB } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Build transaction to add liquidity with ETH (for bundle launches)
 */
export async function buildAddLiquidityETH({ signer, tokenAddress, tokenAmount, ethAmount, to, deadline, nonce, gasLimit, gasPrice, network }: {
  signer: Signer,
  tokenAddress: string,
  tokenAmount: BigNumber | string | number,
  ethAmount: BigNumber | string | number,
  to: string,
  deadline: number,
  nonce?: number,
  gasLimit?: BigNumber | string | number,
  gasPrice?: BigNumber | string | number,
  network?: string
}): Promise<ServiceResponse<{ tx: ethers.PopulatedTransaction }>> {
  try {
    const router = new UniswapV2Router(signer, network);
    const tx = await router.contract.populateTransaction.addLiquidityETH(
      tokenAddress,
      BigNumber.from(tokenAmount),
      0, // amountTokenMin
      0, // amountETHMin
      to,
      deadline,
      { value: BigNumber.from(ethAmount) }
    );
    if (nonce !== undefined) tx.nonce = nonce;
    if (gasLimit !== undefined) tx.gasLimit = BigNumber.from(gasLimit);
    if (gasPrice !== undefined) tx.gasPrice = BigNumber.from(gasPrice);
    return { success: true, data: { tx } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Build transaction to buy tokens with ETH (for bundle launches)
 */
export async function buildBuyTokensWithEth({ signer, tokenAddress, ethAmount, minTokensOut, deadline, nonce, gasLimit, gasPrice, network }: {
  signer: Signer,
  tokenAddress: string,
  ethAmount: BigNumber | string | number,
  minTokensOut: BigNumber | string | number,
  deadline: number,
  nonce?: number,
  gasLimit?: BigNumber | string | number,
  gasPrice?: BigNumber | string | number,
  network?: string
}): Promise<ServiceResponse<{ tx: ethers.PopulatedTransaction }>> {
  try {
    const router = new UniswapV2Router(signer, network);
    const path = ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', tokenAddress]; // WETH -> Token
    
    const tx = await router.contract.populateTransaction.swapExactETHForTokensSupportingFeeOnTransferTokens(
      BigNumber.from(minTokensOut),
      path,
      await signer.getAddress(), // recipient
      deadline,
      { value: BigNumber.from(ethAmount) }
    );
    if (nonce !== undefined) tx.nonce = nonce;
    if (gasLimit !== undefined) tx.gasLimit = BigNumber.from(gasLimit);
    if (gasPrice !== undefined) tx.gasPrice = BigNumber.from(gasPrice);
    return { success: true, data: { tx } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
} 