import { supabase } from '../client';
import type { Database } from '../types/database.types';

type ContractInstance = Database['public']['Tables']['contract_instances']['Row'];
type CreateContractInstance = Database['public']['Tables']['contract_instances']['Insert'];
type UpdateContractInstance = Database['public']['Tables']['contract_instances']['Update'];

export class ContractInstancesRepository {
  async create(data: CreateContractInstance): Promise<{ success: boolean; data?: ContractInstance; error?: string }> {
    try {
      const { data: instance, error } = await supabase
        .from('contract_instances')
        .insert(data)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: instance };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAll(): Promise<{ success: boolean; data?: ContractInstance[]; error?: string }> {
    try {
      const { data: instances, error } = await supabase
        .from('contract_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: instances };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getById(id: string): Promise<{ success: boolean; data?: ContractInstance; error?: string }> {
    try {
      const { data: instance, error } = await supabase
        .from('contract_instances')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: instance };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByUserId(userId: string): Promise<{ success: boolean; data?: ContractInstance[]; error?: string }> {
    try {
      const { data: instances, error } = await supabase
        .from('contract_instances')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: instances };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByTemplateId(templateId: string): Promise<{ success: boolean; data?: ContractInstance[]; error?: string }> {
    try {
      const { data: instances, error } = await supabase
        .from('contract_instances')
        .select('*')
        .eq('template_id', templateId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: instances };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByStatus(status: string): Promise<{ success: boolean; data?: ContractInstance[]; error?: string }> {
    try {
      const { data: instances, error } = await supabase
        .from('contract_instances')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: instances };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async update(id: string, data: UpdateContractInstance): Promise<{ success: boolean; data?: ContractInstance; error?: string }> {
    try {
      const { data: instance, error } = await supabase
        .from('contract_instances')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: instance };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateStatus(id: string, status: string, compilationError?: string): Promise<{ success: boolean; data?: ContractInstance; error?: string }> {
    try {
      const updateData: any = { status };
      if (compilationError) {
        updateData.compilation_error = compilationError;
      }

      const { data: instance, error } = await supabase
        .from('contract_instances')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: instance };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateParameters(id: string, parameters: Record<string, string>): Promise<{ success: boolean; data?: ContractInstance; error?: string }> {
    try {
      const { data: instance, error } = await supabase
        .from('contract_instances')
        .update({ parameters })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: instance };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('contract_instances')
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

  async getUserInstanceByName(userId: string, name: string): Promise<{ success: boolean; data?: ContractInstance; error?: string }> {
    try {
      const { data: instance, error } = await supabase
        .from('contract_instances')
        .select('*')
        .eq('user_id', userId)
        .eq('name', name)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: instance };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export types for external use
export type { ContractInstance, CreateContractInstance, UpdateContractInstance }; 