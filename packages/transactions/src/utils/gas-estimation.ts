import { ethers } from 'ethers';

/**
 * Estimate gas for a contract method call.
 * @param contract ethers.Contract instance
 * @param method method name
 * @param args arguments for the method
 * @param overrides optional transaction overrides
 */
export async function estimateGas(
  contract: ethers.Contract,
  method: string,
  args: any[] = [],
  overrides: ethers.PayableOverrides = {}
): Promise<ethers.BigNumber> {
  return contract.estimateGas[method](...args, overrides);
}

/**
 * Add a buffer to a gas estimate (default 20%).
 */
export function addGasBuffer(gas: ethers.BigNumber, bufferPercent = 20): ethers.BigNumber {
  return gas.mul(100 + bufferPercent).div(100);
} 