import { WalletService } from '@eth-deployer/supabase';

export class DeployerWalletService {
  private supabaseService: WalletService;

  constructor() {
    this.supabaseService = new WalletService();
  }

  async getWalletsByUser(userId: string) {
    return this.supabaseService.getWalletsByUser(userId);
  }

  async getAllWallets() {
    return this.supabaseService.getAllWallets();
  }

  async getWalletById(id: string) {
    return this.supabaseService.getWalletsByUser(id);
  }
} 