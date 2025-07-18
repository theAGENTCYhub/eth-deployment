import { DeploymentsRepository } from '../repositories/deployments';
import { DeploymentsRealtime } from '../realtime/deployments';
import { DeploymentService } from './deployment.service';

export class DatabaseService {
  // Organize by entity rather than by type
  public deployment = {
    repo: new DeploymentsRepository(),
    service: new DeploymentService(),
    realtime: new DeploymentsRealtime()
  };

  // Health check
  async healthCheck(): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await this.deployment.repo.getAll();
      if (error) {
        return { success: false, message: `Database error: ${error}` };
      }
      return { success: true, message: 'Database is healthy' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export singleton instance
export const db = new DatabaseService(); 