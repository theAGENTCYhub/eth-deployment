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