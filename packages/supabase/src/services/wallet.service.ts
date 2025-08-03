import { WalletsRepository, Wallet, CreateWallet, UpdateWallet } from '../repositories/wallets';
import { encrypt, decrypt } from '../utils/crypto';
import { ethers } from 'ethers';

export class WalletService {
  private repo: WalletsRepository;
  constructor() {
    this.repo = new WalletsRepository();
  }

  async createWallet({ privateKey, type, userId, name }: { privateKey: string; type: 'master' | 'minor'; userId?: string; name?: string }): Promise<{ success: boolean; data?: Wallet; error?: string }> {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const encryptedPrivateKey = encrypt(privateKey);
      const result = await this.repo.create({
        address: wallet.address,
        encrypted_private_key: encryptedPrivateKey,
        type,
        user_id: userId || null,
        name: name || null
      });
      return result;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async generateWallet({ type, userId, name }: { type: 'master' | 'minor'; userId?: string; name?: string }): Promise<{ success: boolean; data?: Wallet; error?: string }> {
    const wallet = ethers.Wallet.createRandom();
    return this.createWallet({ privateKey: wallet.privateKey, type, userId, name });
  }

  async importWallet({ privateKey, type, userId, name }: { privateKey: string; type: 'master' | 'minor'; userId?: string; name?: string }) {
    return this.createWallet({ privateKey, type, userId, name });
  }

  async exportPrivateKey(id: string): Promise<{ success: boolean; privateKey?: string; error?: string }> {
    const result = await this.repo.getById(id);
    if (!result.success || !result.data) return { success: false, error: result.error };
    try {
      const privateKey = decrypt(result.data.encrypted_private_key);
      return { success: true, privateKey };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Decryption failed' };
    }
  }

  async getWalletsByUser(userId: string) {
    return this.repo.getByUserId(userId);
  }

  async getAllWallets() {
    return this.repo.getAll();
  }

  async getWalletById(id: string) {
    return this.repo.getById(id);
  }

  async deleteWallet(id: string) {
    return this.repo.delete(id);
  }

  public async updateWalletName(walletId: string, name: string) {
    return this.repo.update(walletId, { name });
  }
} 