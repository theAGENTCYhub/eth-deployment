import { TradesRepository } from '../repositories/trades';
import type { CreateTrade, UpdateTrade } from '../repositories/trades';

export class TradesService {
  private repo = new TradesRepository();

  async create(data: CreateTrade) {
    return this.repo.create(data);
  }

  async getById(id: string) {
    return this.repo.getById(id);
  }

  async getByShortId(shortId: string) {
    return this.repo.getByShortId(shortId);
  }

  async getAllActive() {
    // If you add is_active to trades in the future, filter here
    return this.repo.getAll();
  }
} 