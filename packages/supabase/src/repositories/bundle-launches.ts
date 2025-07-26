import { supabase } from '../client';
import type { Database } from '../types/database.types';

type BundleLaunch = Database['public']['Tables']['bundle_launches']['Row'];
type CreateBundleLaunch = Database['public']['Tables']['bundle_launches']['Insert'];
type UpdateBundleLaunch = Database['public']['Tables']['bundle_launches']['Update'];

export class BundleLaunchesRepository {
  async create(data: CreateBundleLaunch) {
    try {
      // Omit short_id to let the trigger generate it
      const { short_id, ...insertData } = data;
      
      const { data: bundleLaunch, error } = await supabase
        .from('bundle_launches')
        .insert(insertData as any) // Type assertion to bypass short_id requirement
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: bundleLaunch };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAll() {
    try {
      const { data: bundleLaunches, error } = await supabase
        .from('bundle_launches')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: bundleLaunches };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getById(id: string) {
    try {
      const { data: bundleLaunch, error } = await supabase
        .from('bundle_launches')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: bundleLaunch };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByShortId(shortId: string) {
    try {
      const { data: bundleLaunch, error } = await supabase
        .from('bundle_launches')
        .select('*')
        .eq('short_id', shortId)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: bundleLaunch };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByUserId(userId: string) {
    try {
      const { data: bundleLaunches, error } = await supabase
        .from('bundle_launches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: bundleLaunches };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByStatus(status: string) {
    try {
      const { data: bundleLaunches, error } = await supabase
        .from('bundle_launches')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: bundleLaunches };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByUserIdAndStatus(userId: string, status: string) {
    try {
      const { data: bundleLaunches, error } = await supabase
        .from('bundle_launches')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: bundleLaunches };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async searchByTokenName(userId: string, query: string) {
    try {
      const { data: bundleLaunches, error } = await supabase
        .from('bundle_launches')
        .select('*')
        .eq('user_id', userId)
        .ilike('token_name', `%${query}%`)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: bundleLaunches };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async update(id: string, data: UpdateBundleLaunch) {
    try {
      const { data: bundleLaunch, error } = await supabase
        .from('bundle_launches')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: bundleLaunch };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateStatus(id: string, status: string, errorMessage?: string) {
    try {
      const updateData: UpdateBundleLaunch = { status };
      if (errorMessage) {
        updateData.error_message = errorMessage;
      }
      
      const { data: bundleLaunch, error } = await supabase
        .from('bundle_launches')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: bundleLaunch };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('bundle_launches')
        .delete()
        .eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getStatistics(userId: string) {
    try {
      const { data: bundleLaunches, error } = await supabase
        .from('bundle_launches')
        .select('status, total_cost')
        .eq('user_id', userId);
      if (error) return { success: false, error: error.message };
      
      const stats = {
        totalLaunches: bundleLaunches.length,
        activeLaunches: bundleLaunches.filter(l => l.status !== 'failed' && l.status !== 'cancelled').length,
        completedLaunches: bundleLaunches.filter(l => l.status === 'completed').length,
        failedLaunches: bundleLaunches.filter(l => l.status === 'failed').length,
        totalCost: '0', // TODO: Calculate from total_cost fields
        averageCost: '0' // TODO: Calculate average
      };
      
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export type { BundleLaunch, CreateBundleLaunch, UpdateBundleLaunch }; 