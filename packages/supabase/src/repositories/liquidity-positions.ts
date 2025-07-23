import { supabase } from '../client';
import type { Database } from '../types/database.types';

type LiquidityPosition = Database['public']['Tables']['liquidity_positions']['Row'];
type CreateLiquidityPosition = Database['public']['Tables']['liquidity_positions']['Insert'];
type UpdateLiquidityPosition = Database['public']['Tables']['liquidity_positions']['Update'];

export class LiquidityPositionsRepository {
  async create(data: CreateLiquidityPosition) {
    try {
      const { data: liquidityPosition, error } = await supabase
        .from('liquidity_positions')
        .insert(data)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: liquidityPosition };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAll() {
    try {
      const { data: liquidityPositions, error } = await supabase
        .from('liquidity_positions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: liquidityPositions };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getById(id: string) {
    try {
      const { data: liquidityPosition, error } = await supabase
        .from('liquidity_positions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: liquidityPosition };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByShortId(shortId: string) {
    try {
      const { data: liquidityPosition, error } = await supabase
        .from('liquidity_positions')
        .select('*')
        .eq('short_id', shortId)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: liquidityPosition };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async update(id: string, data: UpdateLiquidityPosition) {
    try {
      const { data: liquidityPosition, error } = await supabase
        .from('liquidity_positions')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: liquidityPosition };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('liquidity_positions')
        .delete()
        .eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export type { LiquidityPosition, CreateLiquidityPosition, UpdateLiquidityPosition }; 