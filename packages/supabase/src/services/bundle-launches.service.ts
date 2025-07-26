import { BundleLaunchesRepository } from '../repositories/bundle-launches';
import { BundleWalletsRepository } from '../repositories/bundle-wallets';
import { PositionsRepository } from '../repositories/positions';

// Local ServiceResponse type
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class BundleLaunchesService {
  private bundleLaunchesRepository: BundleLaunchesRepository;
  private bundleWalletsRepository: BundleWalletsRepository;
  private positionsRepository: PositionsRepository;

  constructor() {
    this.bundleLaunchesRepository = new BundleLaunchesRepository();
    this.bundleWalletsRepository = new BundleWalletsRepository();
    this.positionsRepository = new PositionsRepository();
  }

  /**
   * Create a new bundle launch record
   */
  async createBundleLaunch(data: any): Promise<ServiceResponse<{ launchId: string }>> {
    try {
      const result = await this.bundleLaunchesRepository.create(data);
      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to create bundle launch' };
      }
      
      return { success: true, data: { launchId: result.data.id } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create bundle launch'
      };
    }
  }

  /**
   * Get bundle launch by ID
   */
  async getBundleLaunchById(launchId: string): Promise<ServiceResponse<any>> {
    try {
      const result = await this.bundleLaunchesRepository.getById(launchId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get bundle launch'
      };
    }
  }

  /**
   * Update bundle launch status
   */
  async updateBundleLaunchStatus(
    launchId: string, 
    status: string, 
    errorMessage?: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      const result = await this.bundleLaunchesRepository.updateStatus(launchId, status, errorMessage);
      return { success: result.success, data: result.success };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update bundle launch status'
      };
    }
  }

  /**
   * Get bundle launches by user ID
   */
  async getBundleLaunchesByUserId(userId: string): Promise<ServiceResponse<any[]>> {
    try {
      const result = await this.bundleLaunchesRepository.getByUserId(userId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get bundle launches'
      };
    }
  }

  /**
   * Create bundle wallet record
   */
  async createBundleWallet(data: any): Promise<ServiceResponse<{ id: string }>> {
    try {
      const result = await this.bundleWalletsRepository.create(data);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create bundle wallet'
      };
    }
  }

  /**
   * Get bundle wallets by launch ID
   */
  async getBundleWalletsByLaunchId(launchId: string): Promise<ServiceResponse<any[]>> {
    try {
      const result = await this.bundleWalletsRepository.getByLaunchId(launchId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get bundle wallets'
      };
    }
  }

  /**
   * Create position record
   */
  async createPosition(data: any): Promise<ServiceResponse<{ id: string }>> {
    try {
      const result = await this.positionsRepository.create(data);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create position'
      };
    }
  }

  /**
   * Get positions by launch ID
   */
  async getPositionsByLaunchId(launchId: string): Promise<ServiceResponse<any[]>> {
    try {
      const result = await this.positionsRepository.getByLaunchId(launchId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get positions'
      };
    }
  }

  /**
   * Get bundle launch statistics
   */
  async getBundleLaunchStatistics(userId: string): Promise<ServiceResponse<any>> {
    try {
      const result = await this.bundleLaunchesRepository.getStatistics(userId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get bundle launch statistics'
      };
    }
  }

  /**
   * Search bundle launches by token name
   */
  async searchBundleLaunches(userId: string, query: string): Promise<ServiceResponse<any[]>> {
    try {
      const result = await this.bundleLaunchesRepository.searchByTokenName(userId, query);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search bundle launches'
      };
    }
  }

  /**
   * Delete bundle launch
   */
  async deleteBundleLaunch(launchId: string): Promise<ServiceResponse<boolean>> {
    try {
      const result = await this.bundleLaunchesRepository.delete(launchId);
      return { success: result.success, data: result.success };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete bundle launch'
      };
    }
  }
} 