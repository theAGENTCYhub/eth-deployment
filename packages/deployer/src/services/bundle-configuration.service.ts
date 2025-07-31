import { BundleConfigsService } from '@eth-deployer/supabase';

export class BundleConfigurationService {
  private supabaseService: BundleConfigsService;

  constructor() {
    this.supabaseService = new BundleConfigsService();
  }

  async createConfig(
    userId: string, 
    name: string, 
    bundleType: string, 
    bundleWalletCount: number, 
    totalSupplyPercentage: number, 
    fundingWalletId?: string
  ) {
    const configData: any = {
      user_id: userId,
      name,
      bundle_type: bundleType
    };

    // Only include fields that have values
    if (bundleWalletCount !== undefined && bundleWalletCount !== null && bundleWalletCount > 0) {
      configData.bundle_wallet_count = bundleWalletCount;
    }
    
    if (totalSupplyPercentage !== undefined && totalSupplyPercentage !== null && totalSupplyPercentage > 0) {
      configData.total_supply_percentage = totalSupplyPercentage;
    }
    
    if (fundingWalletId && fundingWalletId.trim() !== '') {
      configData.funding_wallet_id = fundingWalletId;
    }

    return this.supabaseService.create(configData);
  }

  async getConfigsByUser(userId: string) {
    return this.supabaseService.getByUserId(userId);
  }

  async getConfigsByBundleType(userId: string, bundleType: string) {
    return this.supabaseService.getByBundleType(userId, bundleType);
  }

  async getConfigById(configId: string) {
    return this.supabaseService.getById(configId);
  }

  async getConfigByName(userId: string, name: string) {
    return this.supabaseService.getByName(userId, name);
  }

  async updateConfig(configId: string, data: any) {
    return this.supabaseService.update(configId, data);
  }

  async deleteConfig(configId: string) {
    return this.supabaseService.delete(configId);
  }
} 