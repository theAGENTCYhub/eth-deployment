import { supabase } from '../client';
import type { Database } from '../types/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type CreateTransaction = Database['public']['Tables']['transactions']['Insert'];
type UpdateTransaction = Database['public']['Tables']['transactions']['Update'];

export class TransactionsRepository {
  async create(data: CreateTransaction) {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert(data)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: transaction };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAll() {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: transactions };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getById(id: string) {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: transaction };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByShortId(shortId: string) {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('short_id', shortId)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: transaction };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async update(id: string, data: UpdateTransaction) {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: transaction };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export type { Transaction, CreateTransaction, UpdateTransaction }; 