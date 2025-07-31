import { supabase } from '../client';
import type { Database } from '../types/database.types';

type LiquidityConfig = Database['public']['Tables']['liquidity_configs']['Row'];
type CreateLiquidityConfig = Database['public']['Tables']['liquidity_configs']['Insert'];
type UpdateLiquidityConfig = Database['public']['Tables']['liquidity_configs']['Update'];

export class LiquidityConfigsRepository {
  async create(data: CreateLiquidityConfig): Promise<{ success: boolean; data?: LiquidityConfig; error?: string }> {
    try {
      const { data: config, error } = await supabase
        .from('liquidity_configs')
        .insert(data)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: config };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getById(id: string): Promise<{ success: boolean; data?: LiquidityConfig; error?: string }> {
    try {
      const { data: config, error } = await supabase
        .from('liquidity_configs')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: config };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByUserId(userId: string): Promise<{ success: boolean; data?: LiquidityConfig[]; error?: string }> {
    try {
      const { data: configs, error } = await supabase
        .from('liquidity_configs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: configs };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByName(userId: string, name: string): Promise<{ success: boolean; data?: LiquidityConfig; error?: string }> {
    try {
      const { data: config, error } = await supabase
        .from('liquidity_configs')
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

  async update(id: string, data: UpdateLiquidityConfig): Promise<{ success: boolean; data?: LiquidityConfig; error?: string }> {
    try {
      const { data: config, error } = await supabase
        .from('liquidity_configs')
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
        .from('liquidity_configs')
        .delete()
        .eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export type { LiquidityConfig, CreateLiquidityConfig, UpdateLiquidityConfig }; 