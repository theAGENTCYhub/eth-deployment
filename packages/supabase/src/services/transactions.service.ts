import { TransactionsRepository } from '../repositories/transactions';
import type { CreateTransaction, UpdateTransaction } from '../repositories/transactions';

export class TransactionsService {
  private repo = new TransactionsRepository();

  async create(data: CreateTransaction) {
    return this.repo.create(data);
  }

  async getById(id: string) {
    return this.repo.getById(id);
  }

  async getByShortId(shortId: string) {
    return this.repo.getByShortId(shortId);
  }

  async getAllActive() {
    // If you add is_active to transactions in the future, filter here
    return this.repo.getAll();
  }
} 