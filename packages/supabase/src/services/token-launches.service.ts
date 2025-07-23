import { TokenLaunchesRepository } from '../repositories/token-launches';
import type { CreateTokenLaunch, UpdateTokenLaunch } from '../repositories/token-launches';

export class TokenLaunchesService {
  private repo = new TokenLaunchesRepository();

  async create(data: CreateTokenLaunch) {
    return this.repo.create(data);
  }

  async getById(id: string) {
    return this.repo.getById(id);
  }

  async getByShortId(shortId: string) {
    return this.repo.getByShortId(shortId);
  }

  async getAllActive() {
    // If you add is_active to token_launches in the future, filter here
    return this.repo.getAll();
  }
} 