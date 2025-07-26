import { ethers } from 'ethers';
import type { ServiceResponse } from '../../types';
import type { BundleLaunchConfig } from '../launch/launch.service';
import { BundleOrchestrationService } from './bundle-orchestration.service';
import { BundleCreationService, type BundleCreationConfig, type BundleResult, type NetworkType } from './bundle-creation.service';
import { BundleCalculationService, type EqualTokenDistributionConfig, type EqualTokenDistributionResult } from './bundle-calculation.service';
import { executeEqualDistributionBundle, type EqualDistributionBundleConfig } from '../../transactions/bundle-equal-distribution.transaction';
import { BundleLaunchesService } from '@eth-deployer/supabase';

export interface BundleLaunchRequest {
  config: BundleLaunchConfig;
  network: NetworkType;
  devWalletPrivateKey: string;
  fundingWalletPrivateKey: string;
  bundleConfig?: BundleCreationConfig;
  userId?: string; // Add userId for database operations
}

export interface BundleLaunchResponse {
  bundleResult: BundleResult;
  orchestrationResult: any; // BundleLaunchResult from orchestration service
  executionResult?: {
    txHashes?: string[];
    bundleHash?: string;
  };
  databaseResult?: {
    launchId: string;
    bundleWallets: Array<{ id: string; address: string; index: number }>;
    positions: Array<{ id: string; walletAddress: string; tokenAmount: string; ethSpent: string }>;
  };
}

export class BundleService {
  private provider: ethers.providers.Provider;
  private orchestrationService: BundleOrchestrationService;
  private creationService: BundleCreationService;
  private calculationService: BundleCalculationService;
  private databaseService: BundleLaunchesService;

  constructor(
    provider: ethers.providers.Provider,
    network: NetworkType,
    devWalletPrivateKey: string,
    fundingWalletPrivateKey: string
  ) {
    this.provider = provider;
    this.orchestrationService = new BundleOrchestrationService(
      provider,
      devWalletPrivateKey,
      fundingWalletPrivateKey
    );
    this.creationService = new BundleCreationService(provider, network);
    this.calculationService = new BundleCalculationService();
    this.databaseService = new BundleLaunchesService();
  }

  /**
   * Complete bundle launch workflow
   */
  async launchBundle(request: BundleLaunchRequest): Promise<ServiceResponse<BundleLaunchResponse>> {
    try {
      console.log('Starting bundle launch workflow...');

      // Step 1: Orchestrate the bundle launch
      console.log('Step 1: Orchestrating bundle launch...');
      const orchestrationResult = await this.orchestrationService.orchestrateBundleLaunch(request.config);
      if (!orchestrationResult.success || !orchestrationResult.data) {
        return {
          success: false,
          error: `Failed to orchestrate bundle launch: ${orchestrationResult.error}`
        };
      }

      // Step 2: Create the bundle for the target network
      console.log('Step 2: Creating bundle for network:', request.network);
      const bundleConfig: BundleCreationConfig = {
        network: request.network,
        ...request.bundleConfig
      };

      const bundleResult = await this.creationService.createBundle(
        orchestrationResult.data,
        bundleConfig
      );
      if (!bundleResult.success || !bundleResult.data) {
        return {
          success: false,
          error: `Failed to create bundle: ${bundleResult.error}`
        };
      }

      // Step 3: Validate the bundle
      console.log('Step 3: Validating bundle...');
      const validationResult = await this.creationService.validateBundle(bundleResult.data);
      if (!validationResult.success || !validationResult.data) {
        return {
          success: false,
          error: `Failed to validate bundle: ${validationResult.error}`
        };
      }

      if (!validationResult.data.isValid) {
        return {
          success: false,
          error: `Bundle validation failed: ${validationResult.data.errors.join(', ')}`
        };
      }

      // Step 4: Execute or submit the bundle based on network
      let executionResult: { txHashes?: string[]; bundleHash?: string } | undefined;

      if (request.network === 'hardhat' && bundleResult.data.type === 'sequential') {
        console.log('Step 4: Executing sequential bundle on hardhat...');
        const executionResponse = await this.creationService.executeSequentialBundle(
          bundleResult.data,
          orchestrationResult.data // Pass orchestration result for dynamic nonce management
        );
        if (executionResponse.success && executionResponse.data) {
          executionResult = { txHashes: executionResponse.data.txHashes };
        } else {
          console.warn('Failed to execute sequential bundle:', executionResponse.error);
        }
      } else if (bundleResult.data.type === 'flashbots') {
        console.log('Step 4: Submitting Flashbots bundle...');
        const submissionResponse = await this.creationService.submitFlashbotsBundle(bundleResult.data);
        if (submissionResponse.success && submissionResponse.data) {
          executionResult = { bundleHash: submissionResponse.data.bundleHash };
        } else {
          console.warn('Failed to submit Flashbots bundle:', submissionResponse.error);
        }
      }

      // Step 5: Store results in database (if userId is provided)
      let databaseResult: BundleLaunchResponse['databaseResult'] | undefined;
      
      if (request.userId && executionResult) {
        console.log('Step 5: Storing results in database...');
        const dbResult = await this.storeBundleResults(
          request.userId,
          request.config,
          orchestrationResult.data,
          executionResult,
          bundleResult.data
        );
        
        if (dbResult.success && dbResult.data) {
          databaseResult = dbResult.data;
          console.log('Database storage completed successfully');
        } else {
          console.warn('Failed to store results in database:', dbResult.error);
        }
      }

      const response: BundleLaunchResponse = {
        bundleResult: bundleResult.data,
        orchestrationResult: orchestrationResult.data,
        executionResult,
        databaseResult
      };

      console.log('Bundle launch workflow completed successfully!');
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to launch bundle'
      };
    }
  }

  /**
   * Get bundle launch estimate
   */
  async estimateBundleLaunch(request: BundleLaunchRequest): Promise<ServiceResponse<{
    orchestrationEstimate: any; // BundleLaunchResult
    bundleEstimate: BundleResult;
    totalEstimatedCost: string;
  }>> {
    try {
      console.log('Estimating bundle launch...');

      // Step 1: Orchestrate the bundle launch
      const orchestrationResult = await this.orchestrationService.orchestrateBundleLaunch(request.config);
      if (!orchestrationResult.success || !orchestrationResult.data) {
        return {
          success: false,
          error: `Failed to orchestrate bundle launch: ${orchestrationResult.error}`
        };
      }

      // Step 2: Create the bundle for estimation
      const bundleConfig: BundleCreationConfig = {
        network: request.network,
        ...request.bundleConfig
      };

      const bundleResult = await this.creationService.createBundle(
        orchestrationResult.data,
        bundleConfig
      );
      if (!bundleResult.success || !bundleResult.data) {
        return {
          success: false,
          error: `Failed to create bundle: ${bundleResult.error}`
        };
      }

      // Calculate total estimated cost
      const totalEstimatedCost = bundleResult.data.estimatedCost;

      return {
        success: true,
        data: {
          orchestrationEstimate: orchestrationResult.data,
          bundleEstimate: bundleResult.data,
          totalEstimatedCost
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to estimate bundle launch'
      };
    }
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(network: NetworkType) {
    return this.creationService.getNetworkConfig(network);
  }

  /**
   * Validate bundle configuration
   */
  async validateBundleConfig(request: BundleLaunchRequest): Promise<ServiceResponse<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate network
      if (!['hardhat', 'sepolia', 'mainnet'].includes(request.network)) {
        errors.push(`Unsupported network: ${request.network}`);
      }

      // Validate wallet private keys
      try {
        new ethers.Wallet(request.devWalletPrivateKey);
      } catch (error) {
        errors.push('Invalid dev wallet private key');
      }

      try {
        new ethers.Wallet(request.fundingWalletPrivateKey);
      } catch (error) {
        errors.push('Invalid funding wallet private key');
      }

      // Validate bundle configuration
      if (request.config.bundle_wallet_count < 1 || request.config.bundle_wallet_count > 50) {
        errors.push('Bundle wallet count must be between 1 and 50');
      }

      if (request.config.bundle_token_percent < 0.1 || request.config.bundle_token_percent > 100) {
        errors.push('Bundle token percentage must be between 0.1% and 100%');
      }

      if (request.config.liquidity_token_percent < 10 || request.config.liquidity_token_percent > 100) {
        errors.push('Liquidity token percentage must be between 10% and 100%');
      }

      // Validate token address
      if (!ethers.utils.isAddress(request.config.tokenAddress)) {
        errors.push('Invalid token address');
      }

      // Validate wallet addresses
      if (!ethers.utils.isAddress(request.config.devWalletAddress)) {
        errors.push('Invalid dev wallet address');
      }

      if (!ethers.utils.isAddress(request.config.fundingWalletAddress)) {
        errors.push('Invalid funding wallet address');
      }

      // Warnings for production networks
      if (request.network === 'mainnet') {
        warnings.push('You are launching on mainnet - ensure all parameters are correct');
        warnings.push('Consider testing on sepolia first');
      }

      // Warnings for gas parameters
      if (request.bundleConfig?.maxGasPrice) {
        const maxGasPrice = ethers.BigNumber.from(request.bundleConfig.maxGasPrice);
        const reasonableGasPrice = ethers.utils.parseUnits('100', 'gwei'); // 100 gwei
        if (maxGasPrice.gt(reasonableGasPrice)) {
          warnings.push('Max gas price seems very high - double check the value');
        }
      }

      return {
        success: true,
        data: {
          isValid: errors.length === 0,
          errors,
          warnings
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate bundle configuration'
      };
    }
  }

  /**
   * Get bundle statistics
   */
  /**
   * Calculate optimal ETH amounts for equal token distribution
   */
  async calculateEqualTokenDistribution(
    config: Omit<EqualTokenDistributionConfig, 'signer'> & { signer: ethers.Signer }
  ): Promise<ServiceResponse<EqualTokenDistributionResult>> {
    try {
      console.log('Calculating equal token distribution...');
      
      // Validate configuration
      const validation = this.calculationService.validateBundleConfig({
        totalTokensToDistribute: config.totalTokensToDistribute,
        walletCount: config.walletCount
      });
      
      if (!validation.success) {
        return {
          success: false,
          error: validation.error
        };
      }
      
      // Calculate optimal distribution
      const result = await this.calculationService.calculateEqualTokenDistribution(config);
      
      if (result.success && result.data) {
        console.log('✅ Equal token distribution calculated successfully');
        console.log(`Total ETH required: ${ethers.utils.formatEther(result.data.totalEthRequired)}`);
        console.log(`Average ETH per wallet: ${ethers.utils.formatEther(result.data.averageEthPerWallet)}`);
        console.log(`Price impact: ${result.data.priceImpact.toFixed(2)}%`);
      }
      
      return result;
      
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
  async executeEqualDistributionBundle(
    config: EqualDistributionBundleConfig
  ): Promise<ServiceResponse<any>> {
    try {
      console.log('Executing equal distribution bundle...');
      
      const result = await executeEqualDistributionBundle(config);
      
      if (result.success && result.data) {
        const successfulBuys = result.data.filter(r => r.success).length;
        const totalBuys = result.data.length;
        
        console.log(`✅ Bundle execution completed: ${successfulBuys}/${totalBuys} successful`);
        
        // Log results
        result.data.forEach((buy, index) => {
          if (buy.success) {
            console.log(`Wallet ${index + 1}: ${ethers.utils.formatUnits(buy.actualTokensReceived, 9)} tokens`);
          } else {
            console.log(`Wallet ${index + 1}: ❌ Failed - ${buy.error}`);
          }
        });
      }
      
      return result;
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getBundleStats(bundleResult: BundleResult): Promise<{
    transactionCount: number;
    totalGasEstimate: string;
    estimatedCost: string;
    estimatedCostInEth: string;
    networkType: string;
  }> {
    const transactionCount = bundleResult.type === 'sequential' 
      ? bundleResult.transactions.length 
      : bundleResult.bundle.signedTransactions.length;

    const estimatedCostInEth = ethers.utils.formatEther(bundleResult.estimatedCost);

    return {
      transactionCount,
      totalGasEstimate: bundleResult.totalGasEstimate,
      estimatedCost: bundleResult.estimatedCost,
      estimatedCostInEth,
      networkType: bundleResult.type
    };
  }

  /**
   * Store bundle results in database
   */
  private async storeBundleResults(
    userId: string,
    config: BundleLaunchConfig,
    orchestrationResult: any,
    executionResult: { txHashes?: string[]; bundleHash?: string },
    bundleResult: BundleResult
  ): Promise<ServiceResponse<BundleLaunchResponse['databaseResult']>> {
    try {
      console.log('Storing bundle results in database...');

      // Step 1: Create bundle launch record
      const launchData = {
        user_id: userId,
        token_address: config.tokenAddress,
        token_name: config.tokenName,
        token_total_supply: config.tokenTotalSupply,
        dev_wallet_address: config.devWalletAddress,
        funding_wallet_address: config.fundingWalletAddress,
        bundle_wallet_count: config.bundle_wallet_count,
        bundle_token_percent: config.bundle_token_percent,
        bundle_token_percent_per_wallet: config.bundle_token_percent_per_wallet,
        liquidity_eth_amount: config.liquidity_eth_amount,
        liquidity_token_percent: config.liquidity_token_percent,
        network: bundleResult.type,
        status: 'completed',
        transaction_hashes: executionResult.txHashes || [],
        bundle_hash: executionResult.bundleHash || null,
        total_gas_estimate: bundleResult.totalGasEstimate,
        estimated_cost: bundleResult.estimatedCost
      };

      const launchResult = await this.databaseService.createBundleLaunch(launchData);
      if (!launchResult.success || !launchResult.data) {
        return { success: false, error: `Failed to create launch record: ${launchResult.error}` };
      }

      const launchId = launchResult.data.launchId;
      console.log(`Created launch record with ID: ${launchId}`);

      // Step 2: Store bundle wallets
      const bundleWallets: Array<{ id: string; address: string; index: number }> = [];
      
      for (const wallet of orchestrationResult.bundleWallets) {
        const walletData = {
          launch_id: launchId,
          wallet_address: wallet.address,
          private_key_encrypted: wallet.privateKey, // TODO: Encrypt this
          wallet_index: wallet.index,
          is_funded: true
        };

        const walletResult = await this.databaseService.createBundleWallet(walletData);
        if (walletResult.success && walletResult.data) {
          bundleWallets.push({
            id: walletResult.data.id,
            address: wallet.address,
            index: wallet.index
          });
        } else {
          console.warn(`Failed to store wallet ${wallet.address}: ${walletResult.error}`);
        }
      }

      console.log(`Stored ${bundleWallets.length} bundle wallets`);

      // Step 3: Create positions (placeholder - will be updated with actual token amounts)
      const positions: Array<{ id: string; walletAddress: string; tokenAmount: string; ethSpent: string }> = [];
      
      for (const wallet of orchestrationResult.bundleWallets) {
        // For now, we'll create placeholder positions
        // In a real implementation, you'd get the actual token amounts from the blockchain
        const positionData = {
          launch_id: launchId,
          wallet_address: wallet.address,
          token_address: config.tokenAddress,
          token_amount: '0', // TODO: Get actual token amount from blockchain
          eth_spent: '0', // TODO: Get actual ETH spent from blockchain
          status: 'completed'
        };

        const positionResult = await this.databaseService.createPosition(positionData);
        if (positionResult.success && positionResult.data) {
          positions.push({
            id: positionResult.data.id,
            walletAddress: wallet.address,
            tokenAmount: positionData.token_amount,
            ethSpent: positionData.eth_spent
          });
        } else {
          console.warn(`Failed to create position for wallet ${wallet.address}: ${positionResult.error}`);
        }
      }

      console.log(`Created ${positions.length} positions`);

      return {
        success: true,
        data: {
          launchId,
          bundleWallets,
          positions
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store bundle results'
      };
    }
  }
} 