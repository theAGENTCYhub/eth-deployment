import { PositionsRepository } from '../repositories/positions';
import type { CreatePosition, UpdatePosition } from '../repositories/positions';

export class PositionsService {
  private repo = new PositionsRepository();

  async create(data: CreatePosition) {
    return this.repo.create(data);
  }

  async getById(id: string) {
    return this.repo.getById(id);
  }

  async getByShortId(shortId: string) {
    return this.repo.getByShortId(shortId);
  }

  async getAllActive() {
    // If you add is_active to positions in the future, filter here
    return this.repo.getAll();
  }
} 