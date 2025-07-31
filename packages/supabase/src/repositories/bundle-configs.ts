import { supabase } from '../client';
import type { Database } from '../types/database.types';

type BundleConfig = Database['public']['Tables']['bundle_configs']['Row'];
type CreateBundleConfig = Database['public']['Tables']['bundle_configs']['Insert'];
type UpdateBundleConfig = Database['public']['Tables']['bundle_configs']['Update'];

export class BundleConfigsRepository {
  async create(data: CreateBundleConfig): Promise<{ success: boolean; data?: BundleConfig; error?: string }> {
    try {
      const { data: config, error } = await supabase
        .from('bundle_configs')
        .insert(data)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: config };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getById(id: string): Promise<{ success: boolean; data?: BundleConfig; error?: string }> {
    try {
      const { data: config, error } = await supabase
        .from('bundle_configs')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: config };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByUserId(userId: string): Promise<{ success: boolean; data?: BundleConfig[]; error?: string }> {
    try {
      const { data: configs, error } = await supabase
        .from('bundle_configs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: configs };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByBundleType(userId: string, bundleType: string): Promise<{ success: boolean; data?: BundleConfig[]; error?: string }> {
    try {
      const { data: configs, error } = await supabase
        .from('bundle_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('bundle_type', bundleType)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: configs };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByName(userId: string, name: string): Promise<{ success: boolean; data?: BundleConfig; error?: string }> {
    try {
      const { data: config, error } = await supabase
        .from('bundle_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('name', name)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: config };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async update(id: string, data: UpdateBundleConfig): Promise<{ success: boolean; data?: BundleConfig; error?: string }> {
    try {
      const { data: config, error } = await supabase
        .from('bundle_configs')
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
        .from('bundle_configs')
        .delete()
        .eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export type { BundleConfig, CreateBundleConfig, UpdateBundleConfig }; 