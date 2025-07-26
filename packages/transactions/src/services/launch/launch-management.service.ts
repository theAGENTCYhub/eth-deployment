import type { ServiceResponse } from '../../types';
import type { BundleLaunchConfig } from './launch.service';
import type { LaunchExecutionConfig } from './launch-execution.service';
import type { LaunchDatabaseService, LaunchRecord } from './launch-database.service';

export interface LaunchSummary {
  id: string;
  tokenName: string;
  tokenAddress: string;
  status: string;
  bundleWalletCount: number;
  totalCost: string;
  createdAt: string;
  error?: string;
}

export interface LaunchDetails {
  id: string;
  userId: string;
  config: BundleLaunchConfig;
  executionConfig: LaunchExecutionConfig;
  status: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  bundleWallets: Array<{
    id: string;
    address: string;
    index: number;
    isFunded: boolean;
  }>;
  positions: Array<{
    id: string;
    walletAddress: string;
    tokenAmount: string;
    ethSpent: string;
    status: string;
  }>;
}

export class LaunchManagementService {
  private databaseService: LaunchDatabaseService;

  constructor(databaseService: LaunchDatabaseService) {
    this.databaseService = databaseService;
  }

  /**
   * Get all launches for a user
   */
  async getUserLaunches(userId: string): Promise<ServiceResponse<LaunchSummary[]>> {
    try {
      const result = await this.databaseService.getLaunchesByUserId(userId);
      if (!result.success || !result.data) {
        return { success: false, error: `Failed to get launches: ${result.error}` };
      }

      const summaries: LaunchSummary[] = result.data.map(launch => ({
        id: launch.id,
        tokenName: launch.config.tokenName,
        tokenAddress: launch.config.tokenAddress,
        status: launch.status,
        bundleWalletCount: launch.config.bundle_wallet_count,
        totalCost: '0', // TODO: Calculate from positions
        createdAt: launch.createdAt,
        error: launch.error
      }));

      return { success: true, data: summaries };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user launches'
      };
    }
  }

  /**
   * Get launch details by ID
   */
  async getLaunchDetails(launchId: string): Promise<ServiceResponse<LaunchDetails>> {
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

      const details: LaunchDetails = {
        id: launchResult.data.id,
        userId: launchResult.data.userId,
        config: launchResult.data.config,
        executionConfig: launchResult.data.executionConfig,
        status: launchResult.data.status,
        error: launchResult.data.error,
        createdAt: launchResult.data.createdAt,
        updatedAt: launchResult.data.updatedAt,
        bundleWallets: (walletsResult.data || []).map(wallet => ({
          id: `wallet_${wallet.index}`,
          address: wallet.address,
          index: wallet.index,
          isFunded: false // TODO: Get from database
        })),
        positions: (positionsResult.data || []).map(position => ({
          id: `position_${position.walletAddress}`,
          walletAddress: position.walletAddress,
          tokenAmount: position.tokenAmount,
          ethSpent: position.ethSpent,
          status: 'pending' // TODO: Get from database
        }))
      };

      return { success: true, data: details };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get launch details'
      };
    }
  }

  /**
   * Get active launches (not failed or cancelled)
   */
  async getActiveLaunches(userId: string): Promise<ServiceResponse<LaunchSummary[]>> {
    try {
      const result = await this.getUserLaunches(userId);
      if (!result.success || !result.data) {
        return result;
      }

      const activeLaunches = result.data.filter(launch => 
        launch.status !== 'failed' && launch.status !== 'cancelled'
      );

      return { success: true, data: activeLaunches };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get active launches'
      };
    }
  }

  /**
   * Get failed launches
   */
  async getFailedLaunches(userId: string): Promise<ServiceResponse<LaunchSummary[]>> {
    try {
      const result = await this.getUserLaunches(userId);
      if (!result.success || !result.data) {
        return result;
      }

      const failedLaunches = result.data.filter(launch => launch.status === 'failed');

      return { success: true, data: failedLaunches };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get failed launches'
      };
    }
  }

  /**
   * Get completed launches
   */
  async getCompletedLaunches(userId: string): Promise<ServiceResponse<LaunchSummary[]>> {
    try {
      const result = await this.getUserLaunches(userId);
      if (!result.success || !result.data) {
        return result;
      }

      const completedLaunches = result.data.filter(launch => launch.status === 'completed');

      return { success: true, data: completedLaunches };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get completed launches'
      };
    }
  }

  /**
   * Delete a launch (soft delete)
   */
  async deleteLaunch(launchId: string): Promise<ServiceResponse<boolean>> {
    try {
      const result = await this.databaseService.deleteLaunch(launchId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete launch'
      };
    }
  }

  /**
   * Get launch statistics
   */
  async getLaunchStatistics(userId: string): Promise<ServiceResponse<{
    totalLaunches: number;
    activeLaunches: number;
    completedLaunches: number;
    failedLaunches: number;
    totalCost: string;
    averageCost: string;
  }>> {
    try {
      const result = await this.getUserLaunches(userId);
      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to get user launches' };
      }

      const launches = result.data;
      const totalLaunches = launches.length;
      const activeLaunches = launches.filter(l => l.status !== 'failed' && l.status !== 'cancelled').length;
      const completedLaunches = launches.filter(l => l.status === 'completed').length;
      const failedLaunches = launches.filter(l => l.status === 'failed').length;

      // Calculate total cost (placeholder - would need to sum from positions)
      const totalCost = '0'; // TODO: Calculate from positions
      const averageCost = totalLaunches > 0 ? '0' : '0'; // TODO: Calculate average

      return {
        success: true,
        data: {
          totalLaunches,
          activeLaunches,
          completedLaunches,
          failedLaunches,
          totalCost,
          averageCost
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get launch statistics'
      };
    }
  }

  /**
   * Search launches by token name or address
   */
  async searchLaunches(
    userId: string, 
    query: string
  ): Promise<ServiceResponse<LaunchSummary[]>> {
    try {
      const result = await this.getUserLaunches(userId);
      if (!result.success || !result.data) {
        return result;
      }

      const searchTerm = query.toLowerCase();
      const filteredLaunches = result.data.filter(launch => 
        launch.tokenName.toLowerCase().includes(searchTerm) ||
        launch.tokenAddress.toLowerCase().includes(searchTerm)
      );

      return { success: true, data: filteredLaunches };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search launches'
      };
    }
  }
} 