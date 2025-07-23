import { ethers } from 'ethers';

/**
 * Calculate minimum amount out given slippage (in percent, e.g. 1 for 1%).
 */
export function getAmountOutMin(amountOut: ethers.BigNumber, slippagePercent: number): ethers.BigNumber {
  return amountOut.mul(100 - slippagePercent).div(100);
}

/**
 * Calculate maximum amount in given slippage (in percent, e.g. 1 for 1%).
 */
export function getAmountInMax(amountIn: ethers.BigNumber, slippagePercent: number): ethers.BigNumber {
  return amountIn.mul(100 + slippagePercent).div(100);
}

/**
 * Convert a decimal string/number to a BigNumber with given decimals.
 */
export function toBigNumber(amount: string | number, decimals = 18): ethers.BigNumber {
  return ethers.utils.parseUnits(amount.toString(), decimals);
}

/**
 * Convert a BigNumber to a decimal string with given decimals.
 */
export function fromBigNumber(amount: ethers.BigNumber, decimals = 18): string {
  return ethers.utils.formatUnits(amount, decimals);
} 