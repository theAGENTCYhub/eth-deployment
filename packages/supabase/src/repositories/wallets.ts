import { supabase } from '../client';
import type { Database } from '../types/database.types';

type Wallet = Database['public']['Tables']['wallets']['Row'];
type CreateWallet = Database['public']['Tables']['wallets']['Insert'];
type UpdateWallet = Database['public']['Tables']['wallets']['Update'];

export class WalletsRepository {
  async create(data: CreateWallet): Promise<{ success: boolean; data?: Wallet; error?: string }> {
    try {
      const { data: wallet, error } = await supabase
        .from('wallets')
        .insert(data)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: wallet };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAll(): Promise<{ success: boolean; data?: Wallet[]; error?: string }> {
    try {
      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: wallets };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAllActive(): Promise<{ success: boolean; data?: Wallet[]; error?: string }> {
    try {
      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: wallets };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getById(id: string): Promise<{ success: boolean; data?: Wallet; error?: string }> {
    try {
      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: wallet };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByUserId(userId: string): Promise<{ success: boolean; data?: Wallet[]; error?: string }> {
    try {
      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: wallets };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async update(id: string, data: UpdateWallet): Promise<{ success: boolean; data?: Wallet; error?: string }> {
    try {
      const { data: wallet, error } = await supabase
        .from('wallets')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: wallet };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async softDelete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('wallets')
        .update({ is_active: false })
        .eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export type { Wallet, CreateWallet, UpdateWallet }; 