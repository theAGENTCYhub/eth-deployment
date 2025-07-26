import { ethers } from 'ethers';
import { 
  LaunchService, 
  type BundleLaunchConfig,
  LaunchExecutionService,
  LaunchDatabaseService,
  LaunchManagementService,
  type LaunchExecutionConfig
} from '../../index';

/**
 * Example: Complete Bundle Launch Workflow
 * 
 * This example demonstrates how to use the complete launch system
 * to execute a bundle launch from start to finish.
 */
export class LaunchExample {
  private provider: ethers.providers.Provider;
  private launchService: LaunchService;
  private databaseService: LaunchDatabaseService;
  private managementService: LaunchManagementService;

  constructor(provider: ethers.providers.Provider) {
    this.provider = provider;
    this.launchService = new LaunchService(provider);
    this.databaseService = new LaunchDatabaseService();
    this.managementService = new LaunchManagementService(this.databaseService);
  }

  /**
   * Example: Complete bundle launch workflow
   */
  async executeCompleteLaunch() {
    try {
      console.log('🚀 Starting complete bundle launch workflow...');

      // Step 1: Define the bundle launch configuration
      const bundleConfig: BundleLaunchConfig = {
        tokenAddress: '0x1234567890123456789012345678901234567890',
        tokenName: 'Example Token',
        tokenTotalSupply: ethers.utils.parseEther('1000000').toString(), // 1M tokens
        devWalletAddress: '0x1111111111111111111111111111111111111111',
        fundingWalletAddress: '0x2222222222222222222222222222222222222222',
        bundle_wallet_count: 5,
        bundle_token_percent: 10, // 10% of supply
        bundle_token_percent_per_wallet: 2, // 2% per wallet
        liquidity_eth_amount: ethers.utils.parseEther('10').toString(), // 10 ETH
        liquidity_token_percent: 80 // 80% to liquidity (20% clog)
      };

      // Step 2: Define execution configuration
      const executionConfig: LaunchExecutionConfig = {
        network: 'hardhat', // or 'sepolia', 'mainnet'
        devWalletPrivateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
        fundingWalletPrivateKey: '0x5678901234567890123456789012345678901234567890123456789012345678',
        maxGasPrice: ethers.utils.parseUnits('50', 'gwei').toString(),
        maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei').toString()
      };

      const userId = 'user_123';

      // Step 3: Estimate the launch
      console.log('📊 Estimating launch...');
      const estimateResult = await this.launchService.estimateLaunch(bundleConfig);
      if (!estimateResult.success || !estimateResult.data) {
        throw new Error(`Estimation failed: ${estimateResult.error}`);
      }

      console.log('💰 Launch estimate:', {
        totalEthRequired: ethers.utils.formatEther(estimateResult.data.totalEthRequired),
        expectedPriceImpact: estimateResult.data.expectedPriceImpact.toFixed(2) + '%',
        slippageWarning: estimateResult.data.slippageWarning
      });

      // Step 4: Execute the launch
      console.log('⚡ Executing launch...');
      const executionResult = await this.launchService.executeLaunch(
        bundleConfig,
        executionConfig,
        userId
      );

      if (!executionResult.success || !executionResult.data) {
        throw new Error(`Launch execution failed: ${executionResult.error}`);
      }

      console.log('✅ Launch executed successfully!');
      console.log('📋 Launch details:', {
        launchId: executionResult.data.launchId,
        status: executionResult.data.status,
        totalCost: ethers.utils.formatEther(executionResult.data.totalCost),
        bundleWallets: executionResult.data.bundleWallets.length,
        positions: executionResult.data.positions.length
      });

      // Step 5: Get launch management information
      console.log('📈 Getting launch management info...');
      await this.getLaunchManagementInfo(userId, executionResult.data.launchId);

      return executionResult.data;
    } catch (error) {
      console.error('❌ Launch workflow failed:', error);
      throw error;
    }
  }

  /**
   * Example: Get launch management information
   */
  async getLaunchManagementInfo(userId: string, launchId: string) {
    try {
      // Get all user launches
      const allLaunches = await this.managementService.getUserLaunches(userId);
      if (allLaunches.success && allLaunches.data) {
        console.log('📊 All launches:', allLaunches.data.length);
      }

      // Get active launches
      const activeLaunches = await this.managementService.getActiveLaunches(userId);
      if (activeLaunches.success && activeLaunches.data) {
        console.log('🟢 Active launches:', activeLaunches.data.length);
      }

      // Get completed launches
      const completedLaunches = await this.managementService.getCompletedLaunches(userId);
      if (completedLaunches.success && completedLaunches.data) {
        console.log('✅ Completed launches:', completedLaunches.data.length);
      }

      // Get launch statistics
      const stats = await this.managementService.getLaunchStatistics(userId);
      if (stats.success && stats.data) {
        console.log('📈 Launch statistics:', stats.data);
      }

      // Get specific launch details
      const launchDetails = await this.managementService.getLaunchDetails(launchId);
      if (launchDetails.success && launchDetails.data) {
        console.log('🔍 Launch details:', {
          id: launchDetails.data.id,
          tokenName: launchDetails.data.config.tokenName,
          status: launchDetails.data.status,
          bundleWallets: launchDetails.data.bundleWallets.length,
          positions: launchDetails.data.positions.length
        });
      }
    } catch (error) {
      console.error('❌ Failed to get launch management info:', error);
    }
  }

  /**
   * Example: Search launches
   */
  async searchLaunches(userId: string, query: string) {
    try {
      const searchResult = await this.managementService.searchLaunches(userId, query);
      if (searchResult.success && searchResult.data) {
        console.log(`🔍 Search results for "${query}":`, searchResult.data.length);
        searchResult.data.forEach((launch: any) => {
          console.log(`  - ${launch.tokenName} (${launch.status})`);
        });
      }
    } catch (error) {
      console.error('❌ Search failed:', error);
    }
  }

  /**
   * Example: Delete a launch
   */
  async deleteLaunch(launchId: string) {
    try {
      const deleteResult = await this.managementService.deleteLaunch(launchId);
      if (deleteResult.success) {
        console.log('🗑️ Launch deleted successfully');
      } else {
        console.error('❌ Failed to delete launch:', deleteResult.error);
      }
    } catch (error) {
      console.error('❌ Delete failed:', error);
    }
  }
}

/**
 * Usage Example:
 * 
 * ```typescript
 * import { ethers } from 'ethers';
 * import { LaunchExample } from './launch-example';
 * 
 * async function main() {
 *   // Create provider
 *   const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
 *   
 *   // Create launch example
 *   const launchExample = new LaunchExample(provider);
 *   
 *   // Execute complete launch
 *   const result = await launchExample.executeCompleteLaunch();
 *   
 *   // Get management info
 *   await launchExample.getLaunchManagementInfo('user_123', result.launchId);
 *   
 *   // Search launches
 *   await launchExample.searchLaunches('user_123', 'Example');
 * }
 * 
 * main().catch(console.error);
 * ```
 */ 