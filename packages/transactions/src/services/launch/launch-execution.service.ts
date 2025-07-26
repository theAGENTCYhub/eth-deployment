import { ethers } from 'ethers';
import type { ServiceResponse } from '../../types';
import type { BundleLaunchConfig } from './launch.service';
import { BundleService, type BundleLaunchRequest, type BundleLaunchResponse } from '../bundle/bundle.service';
import type { LaunchDatabaseService } from './launch-database.service';
import { EventParser } from '../../utils/event-parser';
import type { PositionRecord } from './launch-database.service';
import type { BundleLaunchResult } from '../bundle/bundle-orchestration.service';

export interface LaunchExecutionConfig {
  network: 'hardhat' | 'sepolia' | 'mainnet';
  devWalletPrivateKey: string;
  fundingWalletPrivateKey: string;
  maxGasPrice?: string; // in wei
  maxPriorityFeePerGas?: string; // in wei
  maxFeePerGas?: string; // in wei
  targetBlock?: number;
  bundleTimeout?: number; // in seconds
}

export interface LaunchExecutionResult {
  launchId: string;
  bundleResult: any; // BundleResult from bundle service
  executionResult?: {
    txHashes?: string[];
    bundleHash?: string;
  };
  bundleWallets: Array<{
    id: string;
    address: string;
    index: number;
  }>;
  positions: Array<{
    id: string;
    walletAddress: string;
    tokenAddress: string;
    tokenAmount: string;
    ethSpent: string;
  }>;
  totalCost: string; // in wei
  status: 'pending' | 'executing' | 'completed' | 'failed';
  error?: string;
}

export class LaunchExecutionService {
  private provider: ethers.providers.Provider;
  private bundleService?: BundleService;
  private databaseService: LaunchDatabaseService;

  constructor(
    provider: ethers.providers.Provider,
    databaseService: LaunchDatabaseService
  ) {
    this.provider = provider;
    this.databaseService = databaseService;
  }

  /**
   * Execute a complete bundle launch
   */
  async executeLaunch(
    config: BundleLaunchConfig,
    executionConfig: LaunchExecutionConfig,
    userId: string
  ): Promise<ServiceResponse<LaunchExecutionResult>> {
    try {
      console.log('Starting launch execution...');

      // Step 1: Create bundle service for the specific network
      this.bundleService = new BundleService(
        this.provider,
        executionConfig.network,
        executionConfig.devWalletPrivateKey,
        executionConfig.fundingWalletPrivateKey
      );

      // Step 2: Validate the launch configuration
      console.log('Validating launch configuration...');
      const validationResult = await this.validateLaunchConfiguration(config, executionConfig);
      if (!validationResult.success || !validationResult.data) {
        return { success: false, error: `Validation failed: ${validationResult.error}` };
      }

      if (!validationResult.data.isValid) {
        return { 
          success: false, 
          error: `Configuration validation failed: ${validationResult.data.errors.join(', ')}` 
        };
      }

      // Step 3: Create launch record in database
      console.log('Creating launch record in database...');
      const launchRecord = await this.databaseService.createLaunchRecord({
        userId,
        config,
        executionConfig,
        status: 'pending'
      });

      if (!launchRecord.success || !launchRecord.data) {
        return { success: false, error: `Failed to create launch record: ${launchRecord.error}` };
      }

      // Step 4: Execute the bundle launch
      console.log('Executing bundle launch...');
      const bundleRequest: BundleLaunchRequest = {
        config,
        network: executionConfig.network,
        devWalletPrivateKey: executionConfig.devWalletPrivateKey,
        fundingWalletPrivateKey: executionConfig.fundingWalletPrivateKey,
        bundleConfig: {
          network: executionConfig.network,
          maxGasPrice: executionConfig.maxGasPrice,
          maxPriorityFeePerGas: executionConfig.maxPriorityFeePerGas,
          maxFeePerGas: executionConfig.maxFeePerGas,
          targetBlock: executionConfig.targetBlock,
          bundleTimeout: executionConfig.bundleTimeout
        }
      };

      const bundleResult = await this.bundleService.launchBundle(bundleRequest);
      if (!bundleResult.success || !bundleResult.data) {
        // Update launch status to failed
        await this.databaseService.updateLaunchStatus(
          launchRecord.data.launchId,
          'failed',
          bundleResult.error
        );
        return { success: false, error: `Bundle execution failed: ${bundleResult.error}` };
      }

      // Step 5: Update launch status to executing
      await this.databaseService.updateLaunchStatus(launchRecord.data.launchId, 'executing');

      // Step 6: Store bundle wallets in database
      console.log('Storing bundle wallets...');
      const bundleWallets = await this.storeBundleWallets(
        launchRecord.data.launchId,
        bundleResult.data.orchestrationResult.bundleWallets
      );

      if (!bundleWallets.success || !bundleWallets.data) {
        await this.databaseService.updateLaunchStatus(
          launchRecord.data.launchId,
          'failed',
          'Failed to store bundle wallets'
        );
        return { success: false, error: `Failed to store bundle wallets: ${bundleWallets.error}` };
      }

      // Step 7: Create positions for bundle wallets
      console.log('Creating positions...');
      const positions = await this.createPositions(
        launchRecord.data.launchId,
        bundleResult.data.orchestrationResult,
        config
      );

      if (!positions.success || !positions.data) {
        await this.databaseService.updateLaunchStatus(
          launchRecord.data.launchId,
          'failed',
          'Failed to create positions'
        );
        return { success: false, error: `Failed to create positions: ${positions.error}` };
      }

      // Step 8: Update launch status to completed
      await this.databaseService.updateLaunchStatus(launchRecord.data.launchId, 'completed');

      // Step 9: Calculate total cost
      const totalCost = bundleResult.data.bundleResult.estimatedCost;

      const result: LaunchExecutionResult = {
        launchId: launchRecord.data.launchId,
        bundleResult: bundleResult.data.bundleResult,
        executionResult: bundleResult.data.executionResult,
        bundleWallets: bundleWallets.data,
        positions: positions.data,
        totalCost,
        status: 'completed'
      };

      console.log('Launch execution completed successfully!');
      return { success: true, data: result };
    } catch (error) {
      console.error('Launch execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Launch execution failed'
      };
    }
  }

  /**
   * Validate launch configuration
   */
  private async validateLaunchConfiguration(
    config: BundleLaunchConfig,
    executionConfig: LaunchExecutionConfig
  ): Promise<ServiceResponse<{ isValid: boolean; errors: string[]; warnings: string[] }>> {
    const bundleRequest: BundleLaunchRequest = {
      config,
      network: executionConfig.network,
      devWalletPrivateKey: executionConfig.devWalletPrivateKey,
      fundingWalletPrivateKey: executionConfig.fundingWalletPrivateKey,
      bundleConfig: {
        network: executionConfig.network,
        maxGasPrice: executionConfig.maxGasPrice,
        maxPriorityFeePerGas: executionConfig.maxPriorityFeePerGas,
        maxFeePerGas: executionConfig.maxFeePerGas,
        targetBlock: executionConfig.targetBlock,
        bundleTimeout: executionConfig.bundleTimeout
      }
    };

    if (!this.bundleService) {
      return { success: false, error: 'Bundle service not initialized' };
    }
    return await this.bundleService.validateBundleConfig(bundleRequest);
  }

  /**
   * Store bundle wallets in database
   */
  private async storeBundleWallets(
    launchId: string,
    bundleWallets: Array<{ address: string; privateKey: string; index: number }>
  ): Promise<ServiceResponse<Array<{ id: string; address: string; index: number }>>> {
    try {
      const storedWallets = [];

      for (const wallet of bundleWallets) {
        const result = await this.databaseService.createBundleWallet({
          launchId,
          walletAddress: wallet.address,
          privateKeyEncrypted: wallet.privateKey, // TODO: Encrypt private key
          index: wallet.index
        });

        if (!result.success || !result.data) {
          return { success: false, error: `Failed to store wallet ${wallet.index}: ${result.error}` };
        }

        storedWallets.push({
          id: result.data.id,
          address: wallet.address,
          index: wallet.index
        });
      }

      return { success: true, data: storedWallets };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store bundle wallets'
      };
    }
  }

  /**
   * Create positions for bundle wallets
   */
  private async createPositions(
    launchId: string,
    orchestrationResult: BundleLaunchResult,
    config: BundleLaunchConfig
  ): Promise<ServiceResponse<PositionRecord[]>> {
    try {
      const positions: PositionRecord[] = [];
      const eventParser = new EventParser(this.provider);
      
      // Get buy transaction hashes from bundle execution (for regular trading)
      const buyTransactionHashes = orchestrationResult.buyTransactionHashes || [];
      
      console.log(`Creating positions for ${orchestrationResult.bundleWallets.length} wallets`);
      console.log(`Bundle launch: ${buyTransactionHashes.length === 0 ? 'Yes (using balance queries)' : 'No (using transaction hashes)'}`);

      for (let i = 0; i < orchestrationResult.bundleWallets.length; i++) {
        const wallet = orchestrationResult.bundleWallets[i];
        let tokenAmount = '0';
        let ethSpent = '0';

        // For bundle launches, we don't have individual transaction hashes
        if (buyTransactionHashes.length === 0) {
          console.log(`🔄 Bundle launch detected for wallet ${wallet.address}, using balance query method`);
          
          // ALWAYS get real token amount from blockchain after execution
          tokenAmount = await eventParser.getTokenBalance(config.tokenAddress, wallet.address);
          console.log(`✅ Real token balance from blockchain: ${ethers.utils.formatEther(tokenAmount)} tokens`);
          
          // Get real ETH amount from bundle orchestration result
          // Find the corresponding wallet in the orchestration result
          const walletAmounts = orchestrationResult.walletAmounts || [];
          const walletAmount = walletAmounts.find(w => w.walletIndex === i);
          if (walletAmount) {
            ethSpent = walletAmount.ethAmount.toString();
            console.log(`✅ Using real ETH amount from bundle: ${ethers.utils.formatEther(ethSpent)} ETH`);
          } else {
            // Use the fixed ETH amount from bundle calculation (0.05 ETH per wallet)
            ethSpent = ethers.utils.parseEther('0.05').toString();
            console.log(`⚠️ Using fallback ETH amount: ${ethers.utils.formatEther(ethSpent)} ETH`);
          }
          
        } else {
          // Regular trading with individual transaction hashes
          if (buyTransactionHashes[i]) {
            try {
              console.log(`Parsing buy transaction ${buyTransactionHashes[i]} for wallet ${wallet.address}`);
              
              const swapResult = await eventParser.parseBuyTransaction(
                buyTransactionHashes[i],
                wallet.address,
                config.tokenAddress
              );
              
              tokenAmount = swapResult.tokensReceived;
              ethSpent = swapResult.ethAmount;
              
              console.log(`✅ Wallet ${wallet.address}: ${ethers.utils.formatEther(tokenAmount)} tokens for ${ethers.utils.formatEther(ethSpent)} ETH`);
              
            } catch (parseError) {
              console.error(`❌ Failed to parse transaction events for wallet ${wallet.address}:`, parseError);
              
              // ALWAYS get real token balance from blockchain as fallback
              console.log(`🔄 Falling back to balance query for wallet ${wallet.address}`);
              tokenAmount = await eventParser.getTokenBalance(config.tokenAddress, wallet.address);
              console.log(`✅ Real token balance from blockchain: ${ethers.utils.formatEther(tokenAmount)} tokens`);
              
              // Get ETH amount from orchestration result
              const walletAmounts = orchestrationResult.walletAmounts || [];
              const walletAmount = walletAmounts.find(w => w.walletIndex === i);
              if (walletAmount) {
                ethSpent = walletAmount.ethAmount.toString();
                console.log(`✅ Using real ETH amount from bundle: ${ethers.utils.formatEther(ethSpent)} ETH`);
              } else {
                // Use the fixed ETH amount from bundle calculation (0.05 ETH per wallet)
                ethSpent = ethers.utils.parseEther('0.05').toString();
                console.log(`⚠️ Using fallback ETH amount: ${ethers.utils.formatEther(ethSpent)} ETH`);
              }
            }
          } else {
            console.warn(`No buy transaction hash found for wallet ${wallet.address}, using balance query`);
            // ALWAYS get real token balance from blockchain
            tokenAmount = await eventParser.getTokenBalance(config.tokenAddress, wallet.address);
            console.log(`✅ Real token balance from blockchain: ${ethers.utils.formatEther(tokenAmount)} tokens`);
          }
        }

        // Create position with real data
        const positionResult = await this.databaseService.createPosition({
          launchId,
          walletAddress: wallet.address,
          tokenAddress: config.tokenAddress,
          tokenAmount,  // Real amount from events or balance query
          ethSpent,     // Real ETH spent from transaction value
          status: 'completed'
        });

        if (positionResult.success && positionResult.data) {
          // Create a complete PositionRecord object
          const positionRecord: PositionRecord = {
            id: positionResult.data.id,
            launchId,
            walletAddress: wallet.address,
            tokenAddress: config.tokenAddress,
            tokenAmount,
            ethSpent,
            status: 'completed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          positions.push(positionRecord);
          console.log(`✅ Created position for wallet ${wallet.address}: ${ethers.utils.formatEther(tokenAmount)} tokens`);
        } else {
          console.error(`❌ Failed to create position for wallet ${wallet.address}:`, positionResult.error);
        }
      }

      console.log(`🎉 Successfully created ${positions.length} positions`);
      return { success: true, data: positions };
      
    } catch (error) {
      console.error('❌ Failed to create positions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create positions'
      };
    }
  }

  /**
   * Get launch execution status
   */
  async getLaunchStatus(launchId: string): Promise<ServiceResponse<{
    status: string;
    error?: string;
    bundleWallets: Array<{ address: string; index: number }>;
    positions: Array<{ walletAddress: string; tokenAmount: string; ethSpent: string }>;
  }>> {
    try {
      const launchResult = await this.databaseService.getLaunchById(launchId);
      if (!launchResult.success || !launchResult.data) {
        return { success: false, error: `Launch not found: ${launchResult.error}` };
      }

      const walletsResult = await this.databaseService.getBundleWalletsByLaunchId(launchId);
      if (!walletsResult.success) {
        return { success: false, error: `Failed to get bundle wallets: ${walletsResult.error}` };
      }

      const positionsResult = await this.databaseService.getPositionsByLaunchId(launchId);
      if (!positionsResult.success) {
        return { success: false, error: `Failed to get positions: ${positionsResult.error}` };
      }

      return {
        success: true,
        data: {
          status: launchResult.data.status,
          error: launchResult.data.error,
          bundleWallets: walletsResult.data || [],
          positions: positionsResult.data || []
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get launch status'
      };
    }
  }

  /**
   * Cancel a pending launch
   */
  async cancelLaunch(launchId: string): Promise<ServiceResponse<boolean>> {
    try {
      const result = await this.databaseService.updateLaunchStatus(launchId, 'cancelled');
      return { success: true, data: result.success };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel launch'
      };
    }
  }
} 