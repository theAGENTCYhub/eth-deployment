import { DeploymentConfigsRepository } from '../repositories/deployment-configs';
import type { CreateDeploymentConfig, UpdateDeploymentConfig } from '../repositories/deployment-configs';

export class DeploymentConfigsService {
  private repo = new DeploymentConfigsRepository();

  async create(data: CreateDeploymentConfig) {
    return this.repo.create(data);
  }

  async getById(id: string) {
    return this.repo.getById(id);
  }

  async getByUserId(userId: string) {
    return this.repo.getByUserId(userId);
  }

  async getByTemplateId(userId: string, templateId: string) {
    return this.repo.getByTemplateId(userId, templateId);
  }

  async getByName(userId: string, templateId: string, name: string) {
    return this.repo.getByName(userId, templateId, name);
  }

  async update(id: string, data: UpdateDeploymentConfig) {
    return this.repo.update(id, data);
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }

  /**
   * Load deployment config into a contract instance
   */
  async loadIntoInstance(configId: string, instanceId: string) {
    // This would integrate with contract instances service
    // For now, return success - implementation will be added later
    return { success: true };
  }
} 