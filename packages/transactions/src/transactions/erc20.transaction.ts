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

/**
 * Build transaction for contract to approve LP tokens
 */
export async function buildLPTokenApproveTx({ 
  signer, 
  tokenAddress, 
  pairAddress, 
  nonce, 
  gasLimit, 
  gasPrice 
}: {
  signer: Signer,
  tokenAddress: string,
  pairAddress: string,
  nonce?: number,
  gasLimit?: BigNumber | string | number,
  gasPrice?: BigNumber | string | number
}): Promise<ServiceResponse<{ tx: ethers.PopulatedTransaction }>> {
  try {
    // Contract calls a function that approves LP tokens
    const contract = new ethers.Contract(tokenAddress, [
      'function approveLPTokens(address lpToken, address spender, uint256 amount) external'
    ], signer);
    
    const routerAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
    const tx = await contract.populateTransaction.approveLPTokens(
      pairAddress,
      routerAddress,
      ethers.constants.MaxUint256
    );
    
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
    console.log('\n=== OPENTRADINGV2 DEBUG ===');
    console.log('[DEBUG] Building openTradingV2 transaction for:', tokenAddress);
    
    const contract = new ethers.Contract(tokenAddress, CUSTOM_ERC20_ABI, signer);
    
    // DEBUG: Check contract state before building transaction
    try {
      const signerAddress = await signer.getAddress();
      console.log('[DEBUG] Signer address:', signerAddress);
      
      // Check if signer is the owner
      const owner = await contract.owner();
      console.log('[DEBUG] Contract owner:', owner);
      console.log('[DEBUG] Is signer owner?', signerAddress.toLowerCase() === owner.toLowerCase());
      
      // Check if trading is already open
      try {
        const tradingOpen = await contract.tradingOpen();
        console.log('[DEBUG] Trading already open?', tradingOpen);
        
        // Also check swapEnabled
        const swapEnabled = await contract.swapEnabled();
        console.log('[DEBUG] Swap enabled?', swapEnabled);
        
        // Check if we can call the function directly (simulate the call)
        try {
          console.log('[DEBUG] Simulating openTradingV2 call...');
          const result = await contract.callStatic.openTradingV2();
          console.log('[DEBUG] Static call successful:', result);
        } catch (simError) {
          console.log('[DEBUG] Static call failed:', simError instanceof Error ? simError.message : 'Unknown error');
          // Try to decode the error if it's a revert
          if (simError instanceof Error && 'data' in simError) {
            console.log('[DEBUG] Revert data:', (simError as any).data);
          }
        }
      } catch (error) {
        console.log('[DEBUG] Could not check trading status:', error instanceof Error ? error.message : 'Unknown error');
      }
      
      // Check if signer has tokens (to verify contract is accessible)
      const balance = await contract.balanceOf(signerAddress);
      console.log('[DEBUG] Signer token balance:', balance.toString());
      
    } catch (error) {
      console.log('[DEBUG] Error checking contract state:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Build the transaction
    console.log('[DEBUG] Building openTradingV2 transaction...');
    const tx = await contract.populateTransaction.openTradingV2();
    console.log('[DEBUG] Transaction built successfully');
    console.log('[DEBUG] Transaction data:', tx.data);
    
    // Try to estimate gas for the transaction
    try {
      console.log('[DEBUG] Estimating gas for openTradingV2...');
      const estimatedGas = await contract.estimateGas.openTradingV2();
      console.log('[DEBUG] Estimated gas:', estimatedGas.toString());
    } catch (gasError) {
      console.log('[DEBUG] Gas estimation failed:', gasError instanceof Error ? gasError.message : 'Unknown error');
    }
    
    if (nonce !== undefined) tx.nonce = nonce;
    if (gasLimit !== undefined) tx.gasLimit = BigNumber.from(gasLimit);
    if (gasPrice !== undefined) tx.gasPrice = BigNumber.from(gasPrice);
    
    console.log('[DEBUG] Final transaction nonce:', tx.nonce);
    console.log('[DEBUG] Final transaction gas limit:', tx.gasLimit?.toString());
    console.log('[DEBUG] Final transaction gas price:', tx.gasPrice?.toString());
    console.log('===============================\n');
    
    return { success: true, data: { tx } };
  } catch (error) {
    console.log('[DEBUG] Error building openTradingV2 transaction:', error instanceof Error ? error.message : 'Unknown error');
    console.log('[DEBUG] Full error:', error);
    console.log('===============================\n');
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