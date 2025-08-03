import { DeploymentsRepository } from '../repositories/deployments';

// Local ServiceResponse type
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class DeploymentsService {
  private deploymentsRepository: DeploymentsRepository;

  constructor() {
    this.deploymentsRepository = new DeploymentsRepository();
  }

  /**
   * Get deployment by contract address
   */
  async getDeploymentByContractAddress(contractAddress: string): Promise<ServiceResponse<any>> {
    try {
      const result = await this.deploymentsRepository.getByContractAddress(contractAddress);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get deployment'
      };
    }
  }

  /**
   * Get deployment by ID
   */
  async getDeploymentById(id: string): Promise<ServiceResponse<any>> {
    try {
      const result = await this.deploymentsRepository.getById(id);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get deployment'
      };
    }
  }

  /**
   * Get deployments by user ID
   */
  async getDeploymentsByUserId(userId: string): Promise<ServiceResponse<any[]>> {
    try {
      const result = await this.deploymentsRepository.getByUserId(userId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get deployments'
      };
    }
  }

  /**
   * Create deployment
   */
  async createDeployment(data: any): Promise<ServiceResponse<{ id: string }>> {
    try {
      const result = await this.deploymentsRepository.create(data);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create deployment'
      };
    }
  }

  /**
   * Update deployment
   */
  async updateDeployment(id: string, data: any): Promise<ServiceResponse<boolean>> {
    try {
      const result = await this.deploymentsRepository.update(id, data);
      return { success: result.success, data: result.success };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update deployment'
      };
    }
  }

  /**
   * Delete deployment
   */
  async deleteDeployment(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const result = await this.deploymentsRepository.delete(id);
      return { success: result.success, data: result.success };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete deployment'
      };
    }
  }
} 