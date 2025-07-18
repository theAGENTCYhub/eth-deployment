import { supabase } from '../client';
import type { Database } from '../types/database.types';

type Deployment = Database['public']['Tables']['deployments']['Row'];
type CreateDeployment = Database['public']['Tables']['deployments']['Insert'];
type UpdateDeployment = Database['public']['Tables']['deployments']['Update'];

export class DeploymentsRepository {
  async create(data: CreateDeployment): Promise<{ success: boolean; data?: Deployment; error?: string }> {
    try {
      const { data: deployment, error } = await supabase
        .from('deployments')
        .insert(data)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: deployment };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAll(): Promise<{ success: boolean; data?: Deployment[]; error?: string }> {
    try {
      const { data: deployments, error } = await supabase
        .from('deployments')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
    }

      return { success: true, data: deployments };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getById(id: string): Promise<{ success: boolean; data?: Deployment; error?: string }> {
    try {
      const { data: deployment, error } = await supabase
        .from('deployments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: deployment };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async update(id: string, data: UpdateDeployment): Promise<{ success: boolean; data?: Deployment; error?: string }> {
    try {
      const { data: deployment, error } = await supabase
        .from('deployments')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: deployment };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('deployments')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Complex operations that involve business logic
  async createDeploymentWithTransaction(
    name: string,
    transactionHash: string,
    contractAddress: string
  ): Promise<{ success: boolean; data?: Deployment; error?: string }> {
    try {
      // This is a complex operation that could involve multiple steps
      const deploymentData = {
        name,
        // You could add more fields here when you expand the table
        // transaction_hash: transactionHash,
        // contract_address: contractAddress,
        // status: 'pending'
      };

      const { data: deployment, error } = await supabase
        .from('deployments')
        .insert(deploymentData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: deployment };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateDeploymentStatus(
    id: string, 
    status: 'pending' | 'success' | 'failed',
    transactionHash?: string,
    contractAddress?: string
  ): Promise<{ success: boolean; data?: Deployment; error?: string }> {
    try {
      const updateData: any = {
        // status, // Add this when you expand the table
        // updated_at: new Date().toISOString()
      };

      if (transactionHash) {
        // updateData.transaction_hash = transactionHash;
      }

      if (contractAddress) {
        // updateData.contract_address = contractAddress;
      }

      const { data: deployment, error } = await supabase
        .from('deployments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: deployment };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export types for external use
export type { Deployment, CreateDeployment, UpdateDeployment }; 