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
      if (error) return { success: false, error: error.message };
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
        .order('deployed_at', { ascending: false });
      if (error) return { success: false, error: error.message };
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
      if (error) return { success: false, error: error.message };
      return { success: true, data: deployment };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByContractInstanceId(contractInstanceId: string): Promise<{ success: boolean; data?: Deployment[]; error?: string }> {
    try {
      const { data: deployments, error } = await supabase
        .from('deployments')
        .select('*')
        .eq('contract_instance_id', contractInstanceId)
        .order('deployed_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: deployments };
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
      if (error) return { success: false, error: error.message };
      return { success: true, data: deployment };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateStatus(id: string, status: 'pending' | 'success' | 'failed', errorMessage?: string): Promise<{ success: boolean; data?: Deployment; error?: string }> {
    try {
      const updateData: Partial<UpdateDeployment> = { status };
      if (errorMessage) updateData.error_message = errorMessage;
      const { data: deployment, error } = await supabase
        .from('deployments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
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
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export type { Deployment, CreateDeployment, UpdateDeployment }; 