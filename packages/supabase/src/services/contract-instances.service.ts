import { ContractInstancesRepository } from '../repositories/contract-instances';

// Local ServiceResponse type
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ContractInstancesService {
  private contractInstancesRepository: ContractInstancesRepository;

  constructor() {
    this.contractInstancesRepository = new ContractInstancesRepository();
  }

  /**
   * Get contract instance by ID
   */
  async getContractInstanceById(id: string): Promise<ServiceResponse<any>> {
    try {
      const result = await this.contractInstancesRepository.getById(id);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get contract instance'
      };
    }
  }

  /**
   * Get contract instances by user ID
   */
  async getContractInstancesByUserId(userId: string): Promise<ServiceResponse<any[]>> {
    try {
      const result = await this.contractInstancesRepository.getByUserId(userId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get contract instances'
      };
    }
  }

  /**
   * Create contract instance
   */
  async createContractInstance(data: any): Promise<ServiceResponse<{ id: string }>> {
    try {
      const result = await this.contractInstancesRepository.create(data);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create contract instance'
      };
    }
  }

  /**
   * Update contract instance
   */
  async updateContractInstance(id: string, data: any): Promise<ServiceResponse<boolean>> {
    try {
      const result = await this.contractInstancesRepository.update(id, data);
      return { success: result.success, data: result.success };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update contract instance'
      };
    }
  }

  /**
   * Delete contract instance
   */
  async deleteContractInstance(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const result = await this.contractInstancesRepository.delete(id);
      return { success: result.success, data: result.success };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete contract instance'
      };
    }
  }
} 