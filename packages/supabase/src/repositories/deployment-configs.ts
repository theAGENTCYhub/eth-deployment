import { supabase } from '../client';
import type { Database } from '../types/database.types';

type DeploymentConfig = Database['public']['Tables']['deployment_configs']['Row'];
type CreateDeploymentConfig = Database['public']['Tables']['deployment_configs']['Insert'];
type UpdateDeploymentConfig = Database['public']['Tables']['deployment_configs']['Update'];

export class DeploymentConfigsRepository {
  async create(data: CreateDeploymentConfig): Promise<{ success: boolean; data?: DeploymentConfig; error?: string }> {
    try {
      const { data: config, error } = await supabase
        .from('deployment_configs')
        .insert(data)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: config };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getById(id: string): Promise<{ success: boolean; data?: DeploymentConfig; error?: string }> {
    try {
      const { data: config, error } = await supabase
        .from('deployment_configs')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: config };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByUserId(userId: string): Promise<{ success: boolean; data?: DeploymentConfig[]; error?: string }> {
    try {
      const { data: configs, error } = await supabase
        .from('deployment_configs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: configs };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByTemplateId(userId: string, templateId: string): Promise<{ success: boolean; data?: DeploymentConfig[]; error?: string }> {
    try {
      const { data: configs, error } = await supabase
        .from('deployment_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('template_id', templateId)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: configs };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByName(userId: string, templateId: string, name: string): Promise<{ success: boolean; data?: DeploymentConfig; error?: string }> {
    try {
      const { data: config, error } = await supabase
        .from('deployment_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('template_id', templateId)
        .eq('name', name)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: config };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async update(id: string, data: UpdateDeploymentConfig): Promise<{ success: boolean; data?: DeploymentConfig; error?: string }> {
    try {
      const { data: config, error } = await supabase
        .from('deployment_configs')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: config };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('deployment_configs')
        .delete()
        .eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export type { DeploymentConfig, CreateDeploymentConfig, UpdateDeploymentConfig }; 