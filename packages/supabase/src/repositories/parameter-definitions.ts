import { supabase } from '../client';
import type { Database } from '../types/database.types';

type ParameterDefinition = Database['public']['Tables']['parameter_definitions']['Row'];
type CreateParameterDefinition = Database['public']['Tables']['parameter_definitions']['Insert'];
type UpdateParameterDefinition = Database['public']['Tables']['parameter_definitions']['Update'];

export class ParameterDefinitionsRepository {
  async create(data: CreateParameterDefinition): Promise<{ success: boolean; data?: ParameterDefinition; error?: string }> {
    try {
      const { data: paramDef, error } = await supabase
        .from('parameter_definitions')
        .insert(data)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: paramDef };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAll(): Promise<{ success: boolean; data?: ParameterDefinition[]; error?: string }> {
    try {
      const { data: paramDefs, error } = await supabase
        .from('parameter_definitions')
        .select('*')
        .order('display_order');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: paramDefs };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByKey(key: string): Promise<{ success: boolean; data?: ParameterDefinition; error?: string }> {
    try {
      const { data: paramDef, error } = await supabase
        .from('parameter_definitions')
        .select('*')
        .eq('parameter_key', key)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: paramDef };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByDataType(dataType: string): Promise<{ success: boolean; data?: ParameterDefinition[]; error?: string }> {
    try {
      const { data: paramDefs, error } = await supabase
        .from('parameter_definitions')
        .select('*')
        .eq('data_type', dataType)
        .order('display_order');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: paramDefs };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async update(key: string, data: UpdateParameterDefinition): Promise<{ success: boolean; data?: ParameterDefinition; error?: string }> {
    try {
      const { data: paramDef, error } = await supabase
        .from('parameter_definitions')
        .update(data)
        .eq('parameter_key', key)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: paramDef };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('parameter_definitions')
        .delete()
        .eq('parameter_key', key);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getRequiredParameters(): Promise<{ success: boolean; data?: ParameterDefinition[]; error?: string }> {
    try {
      const { data: paramDefs, error } = await supabase
        .from('parameter_definitions')
        .select('*')
        .eq('is_required', true)
        .order('display_order');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: paramDefs };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export types for external use
export type { ParameterDefinition, CreateParameterDefinition, UpdateParameterDefinition }; 