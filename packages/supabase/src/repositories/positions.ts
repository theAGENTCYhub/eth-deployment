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

  /**
   * Update position after a buy trade
   */
  async updateAfterBuy(id: string, data: {
    additional_amount?: string;
    additional_eth_spent?: string;
    transaction_hash?: string;
  }) {
    try {
      // Get current position
      const currentResult = await this.getById(id);
      if (!currentResult.success || !currentResult.data) {
        return { success: false, error: 'Position not found' };
      }

      const current = currentResult.data;
      
      // Calculate new values
      const currentAmount = parseFloat(current.amount || '0');
      const additionalAmount = parseFloat(data.additional_amount || '0');
      const newAmount = currentAmount + additionalAmount;
      
      const currentEthSpent = parseFloat(current.eth_spent || '0');
      const additionalEthSpent = parseFloat(data.additional_eth_spent || '0');
      const newEthSpent = currentEthSpent + additionalEthSpent;

      // Update position
      const updateData: UpdatePosition = {
        amount: newAmount.toString(),
        eth_spent: newEthSpent.toString(),
        updated_at: new Date().toISOString()
      };

      const { data: position, error } = await supabase
        .from('positions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data: position };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update position after a sell trade
   */
  async updateAfterSell(id: string, data: {
    amount_sold?: string;
    eth_received?: string;
    transaction_hash?: string;
  }) {
    try {
      // Get current position
      const currentResult = await this.getById(id);
      if (!currentResult.success || !currentResult.data) {
        return { success: false, error: 'Position not found' };
      }

      const current = currentResult.data;
      
      // Calculate new values
      const currentAmount = parseFloat(current.amount || '0');
      const amountSold = parseFloat(data.amount_sold || '0');
      const newAmount = Math.max(0, currentAmount - amountSold); // Don't go below 0
      
      const currentEthSpent = parseFloat(current.eth_spent || '0');
      const ethReceived = parseFloat(data.eth_received || '0');
      const newEthSpent = Math.max(0, currentEthSpent - ethReceived); // Don't go below 0

      // Update position
      const updateData: UpdatePosition = {
        amount: newAmount.toString(),
        eth_spent: newEthSpent.toString(),
        updated_at: new Date().toISOString()
      };

      const { data: position, error } = await supabase
        .from('positions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data: position };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export type { Position, CreatePosition, UpdatePosition }; 