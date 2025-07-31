import { LiquidityConfigsRepository } from '../repositories/liquidity-configs';
import type { CreateLiquidityConfig, UpdateLiquidityConfig } from '../repositories/liquidity-configs';

export class LiquidityConfigsService {
  private repo = new LiquidityConfigsRepository();

  async create(data: CreateLiquidityConfig) {
    return this.repo.create(data);
  }

  async getById(id: string) {
    return this.repo.getById(id);
  }

  async getByUserId(userId: string) {
    return this.repo.getByUserId(userId);
  }

  async getByName(userId: string, name: string) {
    return this.repo.getByName(userId, name);
  }

  async update(id: string, data: UpdateLiquidityConfig) {
    return this.repo.update(id, data);
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }
} 