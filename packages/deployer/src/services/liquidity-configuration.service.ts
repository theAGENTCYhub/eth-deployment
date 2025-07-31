import { LiquidityConfigsService } from '@eth-deployer/supabase';

export class LiquidityConfigurationService {
  private supabaseService: LiquidityConfigsService;

  constructor() {
    this.supabaseService = new LiquidityConfigsService();
  }

  async createConfig(userId: string, name: string, initialLiquidityEth?: string, liquidityWalletId?: string) {
    const configData: any = {
      user_id: userId,
      name
    };

    // Only include fields that have values
    if (initialLiquidityEth && initialLiquidityEth.trim() !== '') {
      configData.initial_liquidity_eth = initialLiquidityEth;
    }
    
    if (liquidityWalletId && liquidityWalletId.trim() !== '') {
      configData.liquidity_wallet_id = liquidityWalletId;
    }

    return this.supabaseService.create(configData);
  }

  async getConfigsByUser(userId: string) {
    return this.supabaseService.getByUserId(userId);
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