import { supabase } from '../client';
import type { Database } from '../types/database.types';

type CompiledArtifact = Database['public']['Tables']['compiled_artifacts']['Row'];
type CreateCompiledArtifact = Database['public']['Tables']['compiled_artifacts']['Insert'];
type UpdateCompiledArtifact = Database['public']['Tables']['compiled_artifacts']['Update'];

export class CompiledArtifactsRepository {
  async create(data: CreateCompiledArtifact): Promise<{ success: boolean; data?: CompiledArtifact; error?: string }> {
    try {
      const { data: artifact, error } = await supabase
        .from('compiled_artifacts')
        .insert(data)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: artifact };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAll(): Promise<{ success: boolean; data?: CompiledArtifact[]; error?: string }> {
    try {
      const { data: artifacts, error } = await supabase
        .from('compiled_artifacts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: artifacts };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getById(id: string): Promise<{ success: boolean; data?: CompiledArtifact; error?: string }> {
    try {
      const { data: artifact, error } = await supabase
        .from('compiled_artifacts')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: artifact };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getByInstanceId(instanceId: string): Promise<{ success: boolean; data?: CompiledArtifact[]; error?: string }> {
    try {
      const { data: artifacts, error } = await supabase
        .from('compiled_artifacts')
        .select('*')
        .eq('instance_id', instanceId)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: artifacts };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async update(id: string, data: UpdateCompiledArtifact): Promise<{ success: boolean; data?: CompiledArtifact; error?: string }> {
    try {
      const { data: artifact, error } = await supabase
        .from('compiled_artifacts')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: artifact };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('compiled_artifacts')
        .delete()
        .eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export type { CompiledArtifact, CreateCompiledArtifact, UpdateCompiledArtifact }; 