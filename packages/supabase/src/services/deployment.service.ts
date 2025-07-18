import { DeploymentsRepository } from '../repositories/deployments';
import { DeploymentsRealtime } from '../realtime/deployments';

export class DeploymentService {
  private deployments: DeploymentsRepository;
  private realtime: DeploymentsRealtime;

  constructor() {
    this.deployments = new DeploymentsRepository();
    this.realtime = new DeploymentsRealtime();
  }

  // Handle the complete deployment lifecycle
  async handleDeploymentLifecycle(
    name: string,
    transactionHash: string,
    contractAddress: string
  ): Promise<{ success: boolean; deploymentId?: string; error?: string }> {
    try {
      // Step 1: Create initial deployment record
      const createResult = await this.deployments.createDeploymentWithTransaction(
        name,
        transactionHash,
        contractAddress
      );

      if (!createResult.success || !createResult.data) {
        return { success: false, error: createResult.error || 'Failed to create deployment' };
      }

      const deploymentId = createResult.data.id;

      // Step 2: Update with transaction details
      const updateResult = await this.deployments.updateDeploymentStatus(
        deploymentId,
        'pending',
        transactionHash,
        contractAddress
      );

      if (!updateResult.success) {
        // If update fails, we could clean up the created record
        await this.deployments.delete(deploymentId);
        return { success: false, error: updateResult.error || 'Failed to update deployment' };
      }

      return { success: true, deploymentId };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Batch operations for multiple deployments
  async batchCreateDeployments(
    deployments: Array<{ name: string; transactionHash: string; contractAddress: string }>
  ): Promise<{ success: boolean; results: Array<{ success: boolean; deploymentId?: string; error?: string }> }> {
    const results = [];

    for (const deployment of deployments) {
      const result = await this.handleDeploymentLifecycle(
        deployment.name,
        deployment.transactionHash,
        deployment.contractAddress
      );
      results.push(result);
    }

    const allSuccessful = results.every(r => r.success);
    return { success: allSuccessful, results };
  }

  // Update deployment status after transaction confirmation
  async updateDeploymentStatus(
    deploymentId: string,
    status: 'pending' | 'success' | 'failed',
    transactionHash?: string,
    contractAddress?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.deployments.updateDeploymentStatus(
        deploymentId,
        status,
        transactionHash,
        contractAddress
      );

      return { 
        success: result.success, 
        error: result.error 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get deployment history
  async getDeploymentHistory(limit = 10): Promise<{ success: boolean; deployments?: any[]; error?: string }> {
    try {
      const result = await this.deployments.getAll();
      return { 
        success: result.success, 
        deployments: result.data?.slice(0, limit),
        error: result.error 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Subscribe to deployment updates for real-time notifications
  subscribeToDeploymentUpdates(callback: (payload: any) => void) {
    return this.realtime.subscribeToNew(callback);
  }

  // Subscribe to specific deployment changes
  subscribeToDeployment(deploymentId: string, callback: (payload: any) => void) {
    return this.realtime.subscribeToDeployment(deploymentId, callback);
  }

  // Get repository and realtime instances for direct access if needed
  getRepository() {
    return this.deployments;
  }

  getRealtime() {
    return this.realtime;
  }
} 