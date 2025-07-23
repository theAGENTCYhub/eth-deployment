import { LiquidityPositionsRepository } from '../repositories/liquidity-positions';
import type { CreateLiquidityPosition, UpdateLiquidityPosition } from '../repositories/liquidity-positions';

export class LiquidityPositionsService {
  private repo = new LiquidityPositionsRepository();

  async create(data: CreateLiquidityPosition) {
    return this.repo.create(data);
  }

  async getById(id: string) {
    return this.repo.getById(id);
  }

  async getByShortId(shortId: string) {
    return this.repo.getByShortId(shortId);
  }

  async getAllActive() {
    // If you add is_active to liquidity_positions in the future, filter here
    return this.repo.getAll();
  }
} 