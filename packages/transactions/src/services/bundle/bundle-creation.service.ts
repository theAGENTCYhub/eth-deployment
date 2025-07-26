import { ethers } from 'ethers';
import type { ServiceResponse } from '../../types';
import type { BundleLaunchResult } from './bundle-orchestration.service';

export type NetworkType = 'hardhat' | 'sepolia' | 'mainnet';

export interface BundleCreationConfig {
  network: NetworkType;
  maxGasPrice?: string; // in wei
  maxPriorityFeePerGas?: string; // in wei
  maxFeePerGas?: string; // in wei
  targetBlock?: number;
  bundleTimeout?: number; // in seconds
}

export interface SequentialBundleResult {
  type: 'sequential';
  transactions: string[]; // signed transaction hex strings
  totalGasEstimate: string;
  estimatedCost: string; // in wei
}

export interface FlashbotsBundleResult {
  type: 'flashbots';
  bundle: {
    signedTransactions: string[]; // signed transaction hex strings
    targetBlock: number;
    maxGasPrice?: string;
    maxPriorityFeePerGas?: string;
    maxFeePerGas?: string;
  };
  totalGasEstimate: string;
  estimatedCost: string; // in wei
}

export type BundleResult = SequentialBundleResult | FlashbotsBundleResult;

export class BundleCreationService {
  private provider: ethers.providers.Provider;
  private network: NetworkType;

  constructor(provider: ethers.providers.Provider, network: NetworkType) {
    this.provider = provider;
    this.network = network;
  }

  /**
   * Create a bundle from the orchestration result
   */
  async createBundle(
    orchestrationResult: BundleLaunchResult,
    config: BundleCreationConfig
  ): Promise<ServiceResponse<BundleResult>> {
    try {
      switch (config.network) {
        case 'hardhat':
          return await this.createSequentialBundle(orchestrationResult, config);
        case 'sepolia':
          return await this.createFlashbotsBundle(orchestrationResult, config);
        case 'mainnet':
          return await this.createFlashbotsBundle(orchestrationResult, config);
        default:
          return { success: false, error: `Unsupported network: ${config.network}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create bundle'
      };
    }
  }

  /**
   * Create a sequential bundle for local hardhat testing
   */
  private async createSequentialBundle(
    orchestrationResult: BundleLaunchResult,
    config: BundleCreationConfig
  ): Promise<ServiceResponse<SequentialBundleResult>> {
    try {
      console.log('Creating sequential bundle for hardhat...');

      // For hardhat, we just return the signed transactions in order
      const result: SequentialBundleResult = {
        type: 'sequential',
        transactions: orchestrationResult.signedTransactions,
        totalGasEstimate: orchestrationResult.totalGasEstimate,
        estimatedCost: await this.calculateEstimatedCost(orchestrationResult)
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create sequential bundle'
      };
    }
  }

  /**
   * Create a Flashbots bundle for sepolia/mainnet
   */
  private async createFlashbotsBundle(
    orchestrationResult: BundleLaunchResult,
    config: BundleCreationConfig
  ): Promise<ServiceResponse<FlashbotsBundleResult>> {
    try {
      console.log(`Creating Flashbots bundle for ${config.network}...`);

      // Get current block number for target block
      const currentBlock = await this.provider.getBlockNumber();
      const targetBlock = config.targetBlock || currentBlock + 1;

      // Validate gas parameters
      const gasParams = await this.validateAndGetGasParams(config);

      const result: FlashbotsBundleResult = {
        type: 'flashbots',
        bundle: {
          signedTransactions: orchestrationResult.signedTransactions,
          targetBlock,
          ...gasParams
        },
        totalGasEstimate: orchestrationResult.totalGasEstimate,
        estimatedCost: await this.calculateEstimatedCost(orchestrationResult)
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Flashbots bundle'
      };
    }
  }

  /**
   * Validate and get gas parameters for Flashbots bundle
   */
  private async validateAndGetGasParams(config: BundleCreationConfig): Promise<{
    maxGasPrice?: string;
    maxPriorityFeePerGas?: string;
    maxFeePerGas?: string;
  }> {
    const gasParams: {
      maxGasPrice?: string;
      maxPriorityFeePerGas?: string;
      maxFeePerGas?: string;
    } = {};

    // Get current gas price for reference
    const currentGasPrice = await this.provider.getGasPrice();

    if (config.maxGasPrice) {
      const maxGasPrice = ethers.BigNumber.from(config.maxGasPrice);
      if (maxGasPrice.lt(currentGasPrice)) {
        console.warn(`Warning: maxGasPrice (${ethers.utils.formatUnits(maxGasPrice, 'gwei')} gwei) is lower than current gas price (${ethers.utils.formatUnits(currentGasPrice, 'gwei')} gwei)`);
      }
      gasParams.maxGasPrice = maxGasPrice.toString();
    }

    if (config.maxPriorityFeePerGas) {
      gasParams.maxPriorityFeePerGas = ethers.BigNumber.from(config.maxPriorityFeePerGas).toString();
    }

    if (config.maxFeePerGas) {
      gasParams.maxFeePerGas = ethers.BigNumber.from(config.maxFeePerGas).toString();
    }

    // For EIP-1559 transactions, ensure we have both maxFeePerGas and maxPriorityFeePerGas
    if (gasParams.maxFeePerGas && !gasParams.maxPriorityFeePerGas) {
      // Set a reasonable default priority fee (1 gwei)
      gasParams.maxPriorityFeePerGas = ethers.utils.parseUnits('1', 'gwei').toString();
    }

    return gasParams;
  }

  /**
   * Calculate estimated cost of the bundle
   */
  private async calculateEstimatedCost(orchestrationResult: BundleLaunchResult): Promise<string> {
    try {
      const currentGasPrice = await this.provider.getGasPrice();
      const totalGas = ethers.BigNumber.from(orchestrationResult.totalGasEstimate);
      const estimatedCost = totalGas.mul(currentGasPrice);
      return estimatedCost.toString();
    } catch (error) {
      console.warn('Failed to calculate estimated cost, using fallback');
      // Fallback calculation using a reasonable gas price
      const fallbackGasPrice = ethers.utils.parseUnits('20', 'gwei'); // 20 gwei
      const totalGas = ethers.BigNumber.from(orchestrationResult.totalGasEstimate);
      return totalGas.mul(fallbackGasPrice).toString();
    }
  }

  /**
   * Execute a sequential bundle on hardhat
   */
  async executeSequentialBundle(
    bundle: SequentialBundleResult,
    orchestrationResult: any // BundleLaunchResult
  ): Promise<ServiceResponse<{ txHashes: string[] }>> {
    try {
      // TODO: Implement actual sequential bundle execution
      return {
        success: true,
        data: {
          txHashes: []
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute sequential bundle'
      };
    }
  }

  /**
   * Submit a Flashbots bundle (placeholder - needs Flashbots integration)
   */
  async submitFlashbotsBundle(
    bundle: FlashbotsBundleResult
  ): Promise<ServiceResponse<{ bundleHash: string }>> {
    try {
      console.log('Submitting Flashbots bundle...');
      
      // This is a placeholder - you'll need to integrate with Flashbots
      // For now, we'll just return a mock response
      console.log('Flashbots bundle submission (placeholder):', {
        targetBlock: bundle.bundle.targetBlock,
        transactionCount: bundle.bundle.signedTransactions.length,
        totalGasEstimate: bundle.totalGasEstimate,
        estimatedCost: bundle.estimatedCost
      });

      // TODO: Implement actual Flashbots submission
      // const flashbotsProvider = await FlashbotsBundleProvider.create(provider, wallet, flashbotsUrl);
      // const bundleResponse = await flashbotsProvider.sendBundle(bundle.bundle.signedTransactions, bundle.bundle.targetBlock);
      // const bundleResolution = await bundleResponse.wait();

      return {
        success: true,
        data: {
          bundleHash: 'mock-bundle-hash-' + Date.now() // Placeholder
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit Flashbots bundle'
      };
    }
  }

  /**
   * Get network-specific configuration
   */
  getNetworkConfig(network: NetworkType): {
    flashbotsUrl: string;
    rpcUrl: string;
    chainId: number;
  } {
    switch (network) {
      case 'hardhat':
        return {
          flashbotsUrl: '',
          rpcUrl: 'http://localhost:8545',
          chainId: 31337
        };
      case 'sepolia':
        return {
          flashbotsUrl: 'https://relay-sepolia.flashbots.net',
          rpcUrl: 'https://sepolia.infura.io/v3/your-project-id',
          chainId: 11155111
        };
      case 'mainnet':
        return {
          flashbotsUrl: 'https://relay.flashbots.net',
          rpcUrl: 'https://mainnet.infura.io/v3/your-project-id',
          chainId: 1
        };
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }

  /**
   * Validate bundle before submission
   */
  async validateBundle(
    bundle: BundleResult
  ): Promise<ServiceResponse<{ isValid: boolean; errors: string[] }>> {
    const errors: string[] = [];

    try {
      // Validate transaction count
      if (bundle.type === 'sequential') {
        if (bundle.transactions.length === 0) {
          errors.push('Bundle contains no transactions');
        }
      } else {
        if (bundle.bundle.signedTransactions.length === 0) {
          errors.push('Bundle contains no transactions');
        }
      }

      // Validate gas estimate
      const totalGas = ethers.BigNumber.from(bundle.totalGasEstimate);
      if (totalGas.isZero()) {
        errors.push('Total gas estimate is zero');
      }

      // Validate estimated cost
      const estimatedCost = ethers.BigNumber.from(bundle.estimatedCost);
      if (estimatedCost.isZero()) {
        errors.push('Estimated cost is zero');
      }

      // For Flashbots bundles, validate additional parameters
      if (bundle.type === 'flashbots') {
        if (bundle.bundle.targetBlock <= 0) {
          errors.push('Invalid target block');
        }

        if (bundle.bundle.maxFeePerGas && bundle.bundle.maxPriorityFeePerGas) {
          const maxFee = ethers.BigNumber.from(bundle.bundle.maxFeePerGas);
          const maxPriorityFee = ethers.BigNumber.from(bundle.bundle.maxPriorityFeePerGas);
          if (maxFee.lt(maxPriorityFee)) {
            errors.push('maxFeePerGas cannot be less than maxPriorityFeePerGas');
          }
        }
      }

      return {
        success: true,
        data: {
          isValid: errors.length === 0,
          errors
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate bundle'
      };
    }
  }
} 