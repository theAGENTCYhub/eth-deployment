import { ethers } from 'ethers';
import { provider } from './provider';

/**
 * Instantiate a contract with the given ABI and address, using the default provider.
 */
export function getContract(address: string, abi: any[], signerOrProvider?: ethers.Signer | ethers.providers.Provider) {
	return new ethers.Contract(address, abi, signerOrProvider || provider);
}

/**
 * Call a read-only method on a contract.
 * @param contract ethers.Contract instance
 * @param method method name
 * @param args arguments for the method
 */
export async function callContractMethod<T = any>(contract: ethers.Contract, method: string, args: any[] = []): Promise<T> {
	return contract[method](...args);
}

/**
 * Send a transaction to a contract (write method).
 * @param contract ethers.Contract instance (must be connected to a signer)
 * @param method method name
 * @param args arguments for the method
 * @param overrides optional transaction overrides (gas, value, etc)
 */
export async function sendContractTransaction<T = ethers.ContractTransaction>(
	contract: ethers.Contract,
	method: string,
	args: any[] = [],
	overrides: ethers.PayableOverrides = {}
): Promise<T> {
	return contract[method](...args, overrides);
} 