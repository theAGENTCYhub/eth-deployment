import { supabase } from '../client';
import type { Database } from '../types/database.types';

type TokenLaunch = Database['public']['Tables']['token_launches']['Row'];
type CreateTokenLaunch = Database['public']['Tables']['token_launches']['Insert'];
type UpdateTokenLaunch = Database['public']['Tables']['token_launches']['Update'];

export class TokenLaunchesRepository {
  async create(data: CreateTokenLaunch) {
    try {
      const { data: tokenLaunch, error } = await supabase
        .from('token_launches')
        .insert(data)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: tokenLaunch };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAll() {
    try {
      const { data: tokenLaunches, error } = await supabase
        .from('token_launches')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: tokenLaunches };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getById(id: string) {
    try {
      const { data: tokenLaunch, error } = await supabase
        .from('token_launches')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: tokenLaunch };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByShortId(shortId: string) {
    try {
      const { data: tokenLaunch, error } = await supabase
        .from('token_launches')
        .select('*')
        .eq('short_id', shortId)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: tokenLaunch };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByUserId(userId: string) {
    try {
      const { data: tokenLaunches, error } = await supabase
        .from('token_launches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: tokenLaunches };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByUserIdAndStatus(userId: string, status: string) {
    try {
      const { data: tokenLaunches, error } = await supabase
        .from('token_launches')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: tokenLaunches };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateStatus(id: string, status: string, errorMessage?: string) {
    try {
      const updateData: UpdateTokenLaunch = { status };
      if (errorMessage) {
        updateData.error_message = errorMessage;
      }
      
      const { data: tokenLaunch, error } = await supabase
        .from('token_launches')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: tokenLaunch };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateResults(id: string, results: {
    bundle_hash?: string;
    transaction_hashes?: string[];
    total_cost?: string;
    pair_address?: string;
    amount_token?: string;
    amount_eth?: string;
  }) {
    try {
      const { data: tokenLaunch, error } = await supabase
        .from('token_launches')
        .update(results)
        .eq('id', id)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: tokenLaunch };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getStatisticsByUserId(userId: string) {
    try {
      const { data: tokenLaunches, error } = await supabase
        .from('token_launches')
        .select('status, launch_type')
        .eq('user_id', userId);
      
      if (error) return { success: false, error: error.message };

      const stats = {
        total: tokenLaunches.length,
        not_launched: 0,
        configuring: 0,
        pending: 0,
        executing: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
        standalone: 0,
        bundle: 0
      };

      tokenLaunches.forEach(launch => {
        stats[launch.status as keyof typeof stats]++;
        stats[launch.launch_type as keyof typeof stats]++;
      });

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async searchByUserId(userId: string, query: string) {
    try {
      const { data: tokenLaunches, error } = await supabase
        .from('token_launches')
        .select('*')
        .eq('user_id', userId)
        .or(`token_name.ilike.%${query}%,token_address.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) return { success: false, error: error.message };
      return { success: true, data: tokenLaunches };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async update(id: string, data: UpdateTokenLaunch) {
    try {
      const { data: tokenLaunch, error } = await supabase
        .from('token_launches')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: tokenLaunch };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('token_launches')
        .delete()
        .eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export type { TokenLaunch, CreateTokenLaunch, UpdateTokenLaunch }; 