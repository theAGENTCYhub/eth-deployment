import { TokenLaunchesRepository } from '../repositories/token-launches';
import { BundleWalletsRepository } from '../repositories/bundle-wallets';
import { PositionsRepository } from '../repositories/positions';
import type { Database } from '../types/database.types';

// Use database types
type TokenLaunch = Database['public']['Tables']['token_launches']['Row'];
type CreateTokenLaunch = Database['public']['Tables']['token_launches']['Insert'];
type UpdateTokenLaunch = Database['public']['Tables']['token_launches']['Update'];

// Local ServiceResponse type
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class TokenLaunchesService {
  private tokenLaunchesRepository: TokenLaunchesRepository;
  private bundleWalletsRepository: BundleWalletsRepository;
  private positionsRepository: PositionsRepository;

  constructor() {
    this.tokenLaunchesRepository = new TokenLaunchesRepository();
    this.bundleWalletsRepository = new BundleWalletsRepository();
    this.positionsRepository = new PositionsRepository();
  }

  /**
   * Create a new token launch record (standalone or bundle)
   */
  async createTokenLaunch(data: CreateTokenLaunch): Promise<ServiceResponse<{ launchId: string }>> {
    try {
      const result = await this.tokenLaunchesRepository.create(data);
      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to create token launch' };
      }
      
      return { success: true, data: { launchId: result.data.id } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create token launch'
      };
    }
  }

  /**
   * Get token launch by ID
   */
  async getTokenLaunchById(launchId: string): Promise<ServiceResponse<TokenLaunch>> {
    try {
      const result = await this.tokenLaunchesRepository.getById(launchId);
      
      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Launch not found' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get token launch'
      };
    }
  }

  /**
   * Get token launch by short ID
   */
  async getTokenLaunchByShortId(shortId: string): Promise<ServiceResponse<TokenLaunch>> {
    try {
      const result = await this.tokenLaunchesRepository.getByShortId(shortId);
      
      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Launch not found' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get token launch'
      };
    }
  }

  /**
   * Update token launch status
   */
  async updateTokenLaunchStatus(
    launchId: string, 
    status: string, 
    errorMessage?: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      const result = await this.tokenLaunchesRepository.updateStatus(launchId, status, errorMessage);
      return { success: result.success, data: result.success };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update token launch status'
      };
    }
  }

  /**
   * Get all token launches by user ID
   */
  async getUserLaunches(userId: string): Promise<ServiceResponse<TokenLaunch[]>> {
    try {
      const result = await this.tokenLaunchesRepository.getByUserId(userId);
      
      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'No launches found' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user launches'
      };
    }
  }

  /**
   * Get token launches by user ID and status
   */
  async getUserLaunchesByStatus(
    userId: string, 
    status: string
  ): Promise<ServiceResponse<TokenLaunch[]>> {
    try {
      const result = await this.tokenLaunchesRepository.getByUserIdAndStatus(userId, status);
      
      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'No launches found' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user launches by status'
      };
    }
  }

  /**
   * Create bundle wallet record (for bundle launches)
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
   * Get launch statistics for user
   */
  async getLaunchStatistics(userId: string): Promise<ServiceResponse<any>> {
    try {
      const result = await this.tokenLaunchesRepository.getStatisticsByUserId(userId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get launch statistics'
      };
    }
  }

  /**
   * Search launches by user ID and query
   */
  async searchLaunches(userId: string, query: string): Promise<ServiceResponse<TokenLaunch[]>> {
    try {
      const result = await this.tokenLaunchesRepository.searchByUserId(userId, query);
      
      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'No launches found' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search launches'
      };
    }
  }

  /**
   * Delete token launch
   */
  async deleteTokenLaunch(launchId: string): Promise<ServiceResponse<boolean>> {
    try {
      const result = await this.tokenLaunchesRepository.delete(launchId);
      return { success: result.success, data: result.success };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete token launch'
      };
    }
  }

  /**
   * Update token launch with execution results
   */
  async updateLaunchResults(
    launchId: string,
    results: {
      bundle_hash?: string;
      transaction_hashes?: string[];
      total_cost?: string;
      pair_address?: string;
      amount_token?: string;
      amount_eth?: string;
    }
  ): Promise<ServiceResponse<boolean>> {
    try {
      const result = await this.tokenLaunchesRepository.updateResults(launchId, results);
      return { success: result.success, data: result.success };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update launch results'
      };
    }
  }
} 