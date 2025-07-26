import { supabase } from '../client';
import type { Database } from '../types/database.types';

type BundleWallet = Database['public']['Tables']['bundle_wallets']['Row'];
type CreateBundleWallet = Database['public']['Tables']['bundle_wallets']['Insert'];
type UpdateBundleWallet = Database['public']['Tables']['bundle_wallets']['Update'];

export class BundleWalletsRepository {
  async create(data: CreateBundleWallet) {
    try {
      const { data: wallet, error } = await supabase
        .from('bundle_wallets')
        .insert(data)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: wallet };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getById(id: string) {
    try {
      const { data: wallet, error } = await supabase
        .from('bundle_wallets')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: wallet };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByLaunchId(launchId: string) {
    try {
      const { data: wallets, error } = await supabase
        .from('bundle_wallets')
        .select('*')
        .eq('launch_id', launchId)
        .order('wallet_index', { ascending: true });
      if (error) return { success: false, error: error.message };
      return { success: true, data: wallets };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByLaunchIdAndIndex(launchId: string, walletIndex: number) {
    try {
      const { data: wallet, error } = await supabase
        .from('bundle_wallets')
        .select('*')
        .eq('launch_id', launchId)
        .eq('wallet_index', walletIndex)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: wallet };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByWalletAddress(walletAddress: string) {
    try {
      const { data: wallets, error } = await supabase
        .from('bundle_wallets')
        .select('*')
        .eq('wallet_address', walletAddress);
      if (error) return { success: false, error: error.message };
      return { success: true, data: wallets };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async update(id: string, data: UpdateBundleWallet) {
    try {
      const { data: wallet, error } = await supabase
        .from('bundle_wallets')
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

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('bundle_wallets')
        .delete()
        .eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export type { BundleWallet, CreateBundleWallet, UpdateBundleWallet }; 