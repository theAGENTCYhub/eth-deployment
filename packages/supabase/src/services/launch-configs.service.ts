import { LaunchConfigsRepository } from '../repositories/launch-configs';
import type { CreateLaunchConfig, UpdateLaunchConfig } from '../repositories/launch-configs';

export class LaunchConfigsService {
  private repo = new LaunchConfigsRepository();

  async create(data: CreateLaunchConfig) {
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

  async update(id: string, data: UpdateLaunchConfig) {
    return this.repo.update(id, data);
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }
} 