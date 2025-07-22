import { DeploymentsRepository } from '../repositories/deployments';

export class DeploymentService {
  private deployments: DeploymentsRepository;

  constructor() {
    this.deployments = new DeploymentsRepository();
  }

  async createDeployment(data: {
    contract_instance_id: string;
    wallet_id: string;
    transaction_hash: string;
    contract_address: string;
    status: 'pending' | 'success' | 'failed';
    error_message?: string;
    deployed_at?: string;
  }) {
    return this.deployments.create(data);
  }

  async updateDeployment(id: string, data: Partial<{
    status: 'pending' | 'success' | 'failed';
    error_message?: string;
    transaction_hash?: string;
    contract_address?: string;
    deployed_at?: string;
  }>) {
    return this.deployments.update(id, data);
  }

  async updateDeploymentStatus(id: string, status: 'pending' | 'success' | 'failed', error_message?: string) {
    return this.deployments.updateStatus(id, status, error_message);
  }

  async getDeploymentById(id: string) {
    return this.deployments.getById(id);
  }

  async getDeploymentsByContractInstanceId(contractInstanceId: string) {
    return this.deployments.getByContractInstanceId(contractInstanceId);
  }

  async getAllDeployments() {
    return this.deployments.getAll();
  }

  async deleteDeployment(id: string) {
    return this.deployments.delete(id);
  }
} 