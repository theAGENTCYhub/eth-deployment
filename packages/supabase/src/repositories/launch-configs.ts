import { supabase } from '../client';
import type { Database } from '../types/database.types';

type LaunchConfig = Database['public']['Tables']['launch_configs']['Row'];
type CreateLaunchConfig = Database['public']['Tables']['launch_configs']['Insert'];
type UpdateLaunchConfig = Database['public']['Tables']['launch_configs']['Update'];

// Types now include bundle_token_percent and bundle_token_percent_per_wallet

export class LaunchConfigsRepository {
  async create(data: CreateLaunchConfig) {
    try {
      const { data: config, error } = await supabase
        .from('launch_configs')
        .insert(data)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: config };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getById(id: string) {
    try {
      const { data: config, error } = await supabase
        .from('launch_configs')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: config };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByUserId(userId: string) {
    try {
      const { data: configs, error } = await supabase
        .from('launch_configs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: configs };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByName(userId: string, name: string) {
    try {
      const { data: config, error } = await supabase
        .from('launch_configs')
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

  async update(id: string, data: UpdateLaunchConfig) {
    try {
      const { data: config, error } = await supabase
        .from('launch_configs')
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

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('launch_configs')
        .delete()
        .eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export type { LaunchConfig, CreateLaunchConfig, UpdateLaunchConfig }; 