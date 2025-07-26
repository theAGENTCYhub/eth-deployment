import { supabase } from '../client';
import type { Database } from '../types/database.types';

type Position = Database['public']['Tables']['positions']['Row'];
type CreatePosition = Database['public']['Tables']['positions']['Insert'];
type UpdatePosition = Database['public']['Tables']['positions']['Update'];

export class PositionsRepository {
  async create(data: CreatePosition) {
    try {
      const { data: position, error } = await supabase
        .from('positions')
        .insert(data)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: position };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAll() {
    try {
      const { data: positions, error } = await supabase
        .from('positions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: positions };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getById(id: string) {
    try {
      const { data: position, error } = await supabase
        .from('positions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: position };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByShortId(shortId: string) {
    try {
      const { data: position, error } = await supabase
        .from('positions')
        .select('*')
        .eq('short_id', shortId)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: position };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByLaunchId(launchId: string) {
    try {
      const { data: positions, error } = await supabase
        .from('positions')
        .select('*')
        .eq('launch_id', launchId)
        .order('created_at', { ascending: true });
      if (error) return { success: false, error: error.message };
      return { success: true, data: positions };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByWalletAddress(walletAddress: string) {
    try {
      const { data: positions, error } = await supabase
        .from('positions')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: positions };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByTokenAddress(tokenAddress: string) {
    try {
      const { data: positions, error } = await supabase
        .from('positions')
        .select('*')
        .eq('token_address', tokenAddress)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: positions };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByStatus(status: string) {
    try {
      const { data: positions, error } = await supabase
        .from('positions')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: positions };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async update(id: string, data: UpdatePosition) {
    try {
      const { data: position, error } = await supabase
        .from('positions')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: position };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export type { Position, CreatePosition, UpdatePosition }; 