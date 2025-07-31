import { DeploymentConfigsService } from '@eth-deployer/supabase';

export class DeploymentConfigurationService {
  private supabaseService: DeploymentConfigsService;

  constructor() {
    this.supabaseService = new DeploymentConfigsService();
  }

  async createConfig(userId: string, name: string, parameters?: any) {
    const configData: any = {
      user_id: userId,
      name
    };

    // Only include fields that have values
    if (parameters && Object.keys(parameters).length > 0) {
      configData.parameters = parameters;
    }

    return this.supabaseService.create(configData);
  }

  async getConfigsByUser(userId: string) {
    return this.supabaseService.getByUserId(userId);
  }

  async getConfigsByTemplate(userId: string, templateId: string) {
    return this.supabaseService.getByTemplateId(userId, templateId);
  }

  async getConfigById(configId: string) {
    return this.supabaseService.getById(configId);
  }

  async updateConfig(configId: string, data: any) {
    return this.supabaseService.update(configId, data);
  }

  async deleteConfig(configId: string) {
    return this.supabaseService.delete(configId);
  }

  async loadConfigIntoInstance(configId: string, instanceId: string) {
    return this.supabaseService.loadIntoInstance(configId, instanceId);
  }
} 