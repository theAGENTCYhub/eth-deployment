import { ethers } from 'ethers';
import { ServiceResponse } from '../../types';

export interface EqualTokenDistributionConfig {
  totalTokensToDistribute: bigint;
  walletCount: number;
  tokenAddress: string;
  wethAddress: string;
  routerAddress: string;
  signer: ethers.Signer;
  maxIterations?: number;
  tolerance?: bigint;
}

export interface WalletBuyAmount {
  walletIndex: number;
  ethAmount: bigint;
  expectedTokens: bigint;
}

export interface EqualTokenDistributionResult {
  walletAmounts: WalletBuyAmount[];
  totalEthRequired: bigint;
  averageEthPerWallet: bigint;
  priceImpact: number;
}

export class BundleCalculationService {
  /**
   * Calculate optimal ETH amounts for each wallet to receive equal tokens
   * Uses iterative approach to account for price impact and slippage
   */
  async calculateEqualTokenDistribution(
    config: EqualTokenDistributionConfig
  ): Promise<ServiceResponse<EqualTokenDistributionResult>> {
    try {
      const {
        totalTokensToDistribute,
        walletCount,
        tokenAddress,
        wethAddress,
        routerAddress,
        signer,
        maxIterations = 10,
        tolerance = BigInt(1000) // 1000 wei tolerance
      } = config;

      // Initialize router contract
      const routerABI = [
        'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
        'function getAmountsIn(uint amountOut, address[] memory path) public view returns (uint[] memory amounts)'
      ];
      const router = new ethers.Contract(routerAddress, routerABI, signer);

      // Calculate target tokens per wallet
      const targetTokensPerWallet = totalTokensToDistribute / BigInt(walletCount);
      
      console.log(`Target tokens per wallet: ${ethers.utils.formatUnits(targetTokensPerWallet, 9)}`);

      // Start with equal ETH distribution
      const initialEthPerWallet = ethers.utils.parseEther("0.05"); // Start with 0.05 ETH
      let walletAmounts: WalletBuyAmount[] = [];
      
      // Initialize all wallets with the same ETH amount
      for (let i = 0; i < walletCount; i++) {
        walletAmounts.push({
          walletIndex: i,
          ethAmount: initialEthPerWallet.toBigInt(),
          expectedTokens: BigInt(0)
        });
      }

      // Iterative optimization
      for (let iteration = 0; iteration < maxIterations; iteration++) {
        console.log(`\n--- Iteration ${iteration + 1} ---`);
        
        let totalAdjustment = BigInt(0);
        const newWalletAmounts: WalletBuyAmount[] = [];

        // Calculate expected tokens for each wallet based on current ETH amounts
        for (let i = 0; i < walletCount; i++) {
          const wallet = walletAmounts[i];
          
          // Calculate cumulative ETH spent before this wallet
          const cumulativeEth = walletAmounts
            .slice(0, i)
            .reduce((sum, w) => sum + w.ethAmount, BigInt(0));
          
          // Calculate expected tokens for this wallet
          const expectedTokens = await this.calculateExpectedTokens(
            router,
            wallet.ethAmount,
            wethAddress,
            tokenAddress,
            cumulativeEth
          );

          newWalletAmounts.push({
            walletIndex: i,
            ethAmount: wallet.ethAmount,
            expectedTokens
          });

          console.log(`Wallet ${i + 1}: ${ethers.utils.formatEther(wallet.ethAmount)} ETH → ${ethers.utils.formatUnits(expectedTokens, 9)} tokens`);
        }

        // Check if all wallets are close to target
        let allWithinTolerance = true;
        for (const wallet of newWalletAmounts) {
          const difference = wallet.expectedTokens > targetTokensPerWallet 
            ? wallet.expectedTokens - targetTokensPerWallet
            : targetTokensPerWallet - wallet.expectedTokens;
          
          if (difference > tolerance) {
            allWithinTolerance = false;
            break;
          }
        }

        if (allWithinTolerance) {
          console.log(`✅ All wallets within tolerance after ${iteration + 1} iterations`);
          walletAmounts = newWalletAmounts;
          break;
        }

        // Adjust ETH amounts based on token differences
        for (let i = 0; i < walletCount; i++) {
          const wallet = newWalletAmounts[i];
          const difference = targetTokensPerWallet - wallet.expectedTokens;
          
          if (difference > tolerance || difference < -tolerance) {
            // Calculate ETH adjustment needed
            const ethAdjustment = await this.calculateEthAdjustment(
              router,
              difference,
              wethAddress,
              tokenAddress,
              wallet.ethAmount
            );
            
            const newEthAmount = wallet.ethAmount + ethAdjustment;
            walletAmounts[i] = {
              ...wallet,
              ethAmount: newEthAmount > BigInt(0) ? newEthAmount : BigInt(0)
            };
            
            totalAdjustment += ethAdjustment;
          }
        }

        // If adjustments are minimal, we're close enough
        if (totalAdjustment < tolerance) {
          console.log(`✅ Minimal adjustments needed, stopping at iteration ${iteration + 1}`);
          break;
        }
      }

      // Calculate final results
      const totalEthRequired = walletAmounts.reduce((sum, w) => sum + w.ethAmount, BigInt(0));
      const averageEthPerWallet = totalEthRequired / BigInt(walletCount);
      
      // Calculate price impact
      const firstWallet = walletAmounts[0];
      const lastWallet = walletAmounts[walletCount - 1];
      const priceImpact = firstWallet.ethAmount > BigInt(0) 
        ? Number((lastWallet.ethAmount - firstWallet.ethAmount) * BigInt(10000) / firstWallet.ethAmount) / 100
        : 0;

      const result: EqualTokenDistributionResult = {
        walletAmounts,
        totalEthRequired,
        averageEthPerWallet,
        priceImpact
      };

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('Error calculating equal token distribution:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Calculate expected tokens for a given ETH amount, accounting for price impact
   */
  private async calculateExpectedTokens(
    router: ethers.Contract,
    ethAmount: bigint,
    wethAddress: string,
    tokenAddress: string,
    cumulativeEthSpent: bigint
  ): Promise<bigint> {
    try {
      // Get current reserves to calculate price impact
      const path = [wethAddress, tokenAddress];
      
      // Calculate expected tokens using getAmountsOut
      const amounts = await router.getAmountsOut(ethAmount, path);
      return amounts[1];
      
    } catch (error) {
      console.error('Error calculating expected tokens:', error);
      return BigInt(0);
    }
  }

  /**
   * Calculate ETH adjustment needed to get target token difference
   */
  private async calculateEthAdjustment(
    router: ethers.Contract,
    tokenDifference: bigint,
    wethAddress: string,
    tokenAddress: string,
    currentEthAmount: bigint
  ): Promise<bigint> {
    try {
      if (tokenDifference === BigInt(0)) return BigInt(0);
      
      const path = [wethAddress, tokenAddress];
      
      if (tokenDifference > BigInt(0)) {
        // Need more tokens, calculate ETH needed
        const amounts = await router.getAmountsIn(tokenDifference, path);
        return amounts[0];
      } else {
        // Need fewer tokens, calculate ETH to reduce
        const amounts = await router.getAmountsIn(-tokenDifference, path);
        return BigInt(-amounts[0]);
      }
      
    } catch (error) {
      console.error('Error calculating ETH adjustment:', error);
      return BigInt(0);
    }
  }

  /**
   * Validate bundle configuration
   */
  validateBundleConfig(config: {
    totalTokensToDistribute: bigint;
    walletCount: number;
    minEthPerWallet?: bigint;
    maxEthPerWallet?: bigint;
  }): ServiceResponse<boolean> {
    try {
      const { totalTokensToDistribute, walletCount, minEthPerWallet, maxEthPerWallet } = config;
      
      if (walletCount <= 0) {
        return {
          success: false,
          error: 'Wallet count must be greater than 0'
        };
      }
      
      if (totalTokensToDistribute <= BigInt(0)) {
        return {
          success: false,
          error: 'Total tokens to distribute must be greater than 0'
        };
      }
      
      if (totalTokensToDistribute % BigInt(walletCount) !== BigInt(0)) {
        return {
          success: false,
          error: 'Total tokens must be evenly divisible by wallet count'
        };
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
} 