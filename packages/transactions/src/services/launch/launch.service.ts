import { ethers } from 'ethers';
import type { ServiceResponse } from '../../types';
import { estimateBundleLaunch } from '../../utils/bundle-calculations';

export interface BundleLaunchConfig {
  // Token configuration
  tokenAddress: string;
  tokenName: string;
  tokenTotalSupply: string; // in wei

  // Wallet configuration
  devWalletAddress: string;
  fundingWalletAddress: string;

  // Bundle configuration
  bundle_wallet_count: number;
  bundle_token_percent: number; // total % of supply to buy
  bundle_token_percent_per_wallet: number; // % per wallet

  // Liquidity configuration
  liquidity_eth_amount: string; // in wei
  liquidity_token_percent: number; // % of supply for initial liquidity
}

export interface BundleLaunchEstimate {
  // Cost breakdown
  initialLiquidityEth: string; // in wei
  bundleBuyEth: string; // in wei (total for all wallets)
  gasPaddingEth: string; // in wei
  totalEthRequired: string; // in wei
  
  // Per-wallet breakdown
  ethPerWallet: string; // in wei
  tokensPerWallet: string; // in wei
  
  // Price impact estimates
  expectedPriceImpact: number; // percentage
  slippageWarning: string;
  
  // Bundle details
  totalTokensToBuy: string; // in wei
  tokensForLiquidity: string; // in wei
  tokensForClog: string; // in wei
  
  // Detailed wallet breakdown
  walletBreakdown: Array<{
    walletIndex: number;
    ethSpent: string; // in wei
    tokensReceived: string; // in wei
    priceImpact: number; // percentage
  }>;
}

export class LaunchService {
  private provider: ethers.providers.Provider;

  constructor(provider: ethers.providers.Provider) {
    this.provider = provider;
  }

  /**
   * Estimate the cost and parameters for a bundle launch
   * This calculates all costs, price impacts, and required amounts
   */
  async estimateLaunch(config: BundleLaunchConfig): Promise<ServiceResponse<BundleLaunchEstimate>> {
    try {
      const estimate = await estimateBundleLaunch(this.provider, config);
      return { success: true, data: estimate };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to estimate bundle launch'
      };
    }
  }

  /**
   * Execute the actual bundle launch
   */
  async executeLaunch(
    config: BundleLaunchConfig,
    executionConfig: {
      network: 'hardhat' | 'sepolia' | 'mainnet';
      devWalletPrivateKey: string;
      fundingWalletPrivateKey: string;
      maxGasPrice?: string;
      maxPriorityFeePerGas?: string;
      maxFeePerGas?: string;
      targetBlock?: number;
      bundleTimeout?: number;
    },
    userId: string
  ): Promise<ServiceResponse<any>> {
    try {
      // Import the execution service dynamically to avoid circular dependencies
      const { LaunchExecutionService } = await import('./launch-execution.service');
      const { LaunchDatabaseService } = await import('./launch-database.service');
      
      const databaseService = new LaunchDatabaseService();
      const executionService = new LaunchExecutionService(this.provider, databaseService);
      
      const result = await executionService.executeLaunch(config, executionConfig, userId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute launch'
      };
    }
  }
} 