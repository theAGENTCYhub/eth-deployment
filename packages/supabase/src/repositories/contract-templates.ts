import { supabase } from '../client';
import type { Database } from '../types/database.types';

type ContractTemplate = Database['public']['Tables']['contract_templates']['Row'];
type CreateContractTemplate = Database['public']['Tables']['contract_templates']['Insert'];
type UpdateContractTemplate = Database['public']['Tables']['contract_templates']['Update'];

export class ContractTemplatesRepository {
  async create(data: CreateContractTemplate): Promise<{ success: boolean; data?: ContractTemplate; error?: string }> {
    try {
      const { data: template, error } = await supabase
        .from('contract_templates')
        .insert(data)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: template };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAll(): Promise<{ success: boolean; data?: ContractTemplate[]; error?: string }> {
    try {
      const { data: templates, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: templates };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getById(id: string): Promise<{ success: boolean; data?: ContractTemplate; error?: string }> {
    try {
      const { data: template, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: template };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByCategory(category: string): Promise<{ success: boolean; data?: ContractTemplate[]; error?: string }> {
    try {
      const { data: templates, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('name');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: templates };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async update(id: string, data: UpdateContractTemplate): Promise<{ success: boolean; data?: ContractTemplate; error?: string }> {
    try {
      const { data: template, error } = await supabase
        .from('contract_templates')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: template };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('contract_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async searchByName(name: string): Promise<{ success: boolean; data?: ContractTemplate[]; error?: string }> {
    try {
      const { data: templates, error } = await supabase
        .from('contract_templates')
        .select('*')
        .ilike('name', `%${name}%`)
        .eq('is_active', true)
        .order('name');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: templates };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export types for external use
export type { ContractTemplate, CreateContractTemplate, UpdateContractTemplate }; 