import { BundleWalletsRepository } from '../repositories/bundle-wallets';
import type { CreateBundleWallet, UpdateBundleWallet } from '../repositories/bundle-wallets';

export class BundleWalletsService {
  private repo = new BundleWalletsRepository();

  async create(data: CreateBundleWallet) {
    return this.repo.create(data);
  }

  async getById(id: string) {
    return this.repo.getById(id);
  }

  async getByLaunchId(launchId: string) {
    return this.repo.getByLaunchId(launchId);
  }

  async getByWalletAddress(walletAddress: string) {
    return this.repo.getByWalletAddress(walletAddress);
  }

  async update(id: string, data: UpdateBundleWallet) {
    return this.repo.update(id, data);
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }
} 