import { ethers } from 'ethers';
import { ServiceResponse } from '../types';

export interface BundleBuyTransaction {
  walletAddress: string;
  ethAmount: bigint;
  expectedTokens: bigint;
  nonce: number;
  gasLimit: bigint;
  gasPrice: bigint;
}

export interface EqualDistributionBundleConfig {
  walletAddresses: string[];
  ethAmounts: bigint[];
  expectedTokens: bigint[];
  tokenAddress: string;
  wethAddress: string;
  routerAddress: string;
  signer: ethers.Signer;
}

export interface BundleBuyResult {
  walletAddress: string;
  transactionHash: string;
  actualTokensReceived: bigint;
  ethSpent: bigint;
  gasUsed: bigint;
  success: boolean;
  error?: string;
}

/**
 * Build transaction for a single bundle buy with exact ETH amount
 */
export async function buildBundleBuyTransaction({
  walletAddress,
  ethAmount,
  expectedTokens,
  tokenAddress,
  wethAddress,
  routerAddress,
  nonce,
  gasLimit,
  gasPrice
}: {
  walletAddress: string;
  ethAmount: bigint;
  expectedTokens: bigint;
  tokenAddress: string;
  wethAddress: string;
  routerAddress: string;
  nonce: number;
  gasLimit: bigint;
  gasPrice: bigint;
}): Promise<ServiceResponse<{ tx: ethers.PopulatedTransaction }>> {
  try {
    const routerABI = [
      'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable'
    ];
    
    const router = new ethers.Contract(routerAddress, routerABI);
    
    // Calculate minimum tokens to receive (with 1% slippage tolerance)
    const minTokensOut = (expectedTokens * BigInt(99)) / BigInt(100);
    
    const path = [wethAddress, tokenAddress];
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    
    const tx = await router.populateTransaction.swapExactETHForTokensSupportingFeeOnTransferTokens(
      minTokensOut,
      path,
      walletAddress,
      deadline,
      {
        value: ethAmount,
        nonce,
        gasLimit,
        gasPrice
      }
    );
    
    return {
      success: true,
      data: { tx }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Execute bundle buys with equal token distribution
 */
export async function executeEqualDistributionBundle(
  config: EqualDistributionBundleConfig
): Promise<ServiceResponse<BundleBuyResult[]>> {
  try {
    const {
      walletAddresses,
      ethAmounts,
      expectedTokens,
      tokenAddress,
      wethAddress,
      routerAddress,
      signer
    } = config;
    
    if (walletAddresses.length !== ethAmounts.length || ethAmounts.length !== expectedTokens.length) {
      return {
        success: false,
        error: 'Arrays must have the same length'
      };
    }
    
    const routerABI = [
      'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable'
    ];
    const router = new ethers.Contract(routerAddress, routerABI, signer);
    
    const results: BundleBuyResult[] = [];
    
    // Execute buys sequentially to account for price impact
    for (let i = 0; i < walletAddresses.length; i++) {
      const walletAddress = walletAddresses[i];
      const ethAmount = ethAmounts[i];
      const expectedTokenAmount = expectedTokens[i];
      
      try {
        console.log(`\n🛒 Executing buy ${i + 1}/${walletAddresses.length}`);
        console.log(`Wallet: ${walletAddress}`);
        console.log(`ETH Amount: ${ethers.utils.formatEther(ethAmount)}`);
        console.log(`Expected Tokens: ${ethers.utils.formatUnits(expectedTokenAmount, 9)}`);
        
        // Get current nonce for this wallet
        const nonce = await signer.provider!.getTransactionCount(walletAddress);
        
        // Calculate minimum tokens to receive (with 1% slippage tolerance)
        const minTokensOut = (expectedTokenAmount * BigInt(99)) / BigInt(100);
        
        const path = [wethAddress, tokenAddress];
        const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
        
        // Execute the transaction
        const tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
          minTokensOut,
          path,
          walletAddress,
          deadline,
          {
            value: ethAmount
          }
        );
        
        console.log(`Transaction sent: ${tx.hash}`);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        
        // Get actual tokens received
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)'],
          signer.provider
        );
        
        const actualTokensReceived = await tokenContract.balanceOf(walletAddress);
        const ethSpent = receipt.gasUsed * receipt.gasPrice;
        
        console.log(`✅ Buy completed:`);
        console.log(`  - Actual tokens: ${ethers.utils.formatUnits(actualTokensReceived, 9)}`);
        console.log(`  - ETH spent: ${ethers.utils.formatEther(ethSpent)}`);
        console.log(`  - Gas used: ${receipt.gasUsed.toString()}`);
        
        results.push({
          walletAddress,
          transactionHash: tx.hash,
          actualTokensReceived,
          ethSpent: BigInt(ethSpent.toString()),
          gasUsed: BigInt(receipt.gasUsed.toString()),
          success: true
        });
        
        // Small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Buy failed for wallet ${walletAddress}:`, error);
        
        results.push({
          walletAddress,
          transactionHash: '',
          actualTokensReceived: BigInt(0),
          ethSpent: BigInt(0),
          gasUsed: BigInt(0),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return {
      success: true,
      data: results
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Validate bundle buy configuration
 */
export function validateBundleBuyConfig(config: EqualDistributionBundleConfig): ServiceResponse<boolean> {
  try {
    const { walletAddresses, ethAmounts, expectedTokens } = config;
    
    if (walletAddresses.length === 0) {
      return {
        success: false,
        error: 'At least one wallet address is required'
      };
    }
    
    if (walletAddresses.length !== ethAmounts.length || ethAmounts.length !== expectedTokens.length) {
      return {
        success: false,
        error: 'All arrays must have the same length'
      };
    }
    
    // Check for valid addresses
    for (const address of walletAddresses) {
      if (!ethers.utils.isAddress(address)) {
        return {
          success: false,
          error: `Invalid wallet address: ${address}`
        };
      }
    }
    
    // Check for positive amounts
    for (let i = 0; i < ethAmounts.length; i++) {
      if (ethAmounts[i] <= BigInt(0)) {
        return {
          success: false,
          error: `ETH amount must be positive for wallet ${i + 1}`
        };
      }
      
      if (expectedTokens[i] <= BigInt(0)) {
        return {
          success: false,
          error: `Expected tokens must be positive for wallet ${i + 1}`
        };
      }
    }
    
    return {
      success: true,
      data: true
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 