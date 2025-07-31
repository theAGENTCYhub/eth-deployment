import { BundleConfigsRepository } from '../repositories/bundle-configs';
import type { CreateBundleConfig, UpdateBundleConfig } from '../repositories/bundle-configs';

export class BundleConfigsService {
  private repo = new BundleConfigsRepository();

  async create(data: CreateBundleConfig) {
    return this.repo.create(data);
  }

  async getById(id: string) {
    return this.repo.getById(id);
  }

  async getByUserId(userId: string) {
    return this.repo.getByUserId(userId);
  }

  async getByBundleType(userId: string, bundleType: string) {
    return this.repo.getByBundleType(userId, bundleType);
  }

  async getByName(userId: string, name: string) {
    return this.repo.getByName(userId, name);
  }

  async update(id: string, data: UpdateBundleConfig) {
    return this.repo.update(id, data);
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }
} 