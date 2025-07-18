import { REALTIME_LISTEN_TYPES } from '@supabase/supabase-js';
import { supabase } from '../client';
import type { Database } from '../types/database.types';

type Deployment = Database['public']['Tables']['deployments']['Row'];

export class DeploymentsRealtime {
  private subscriptions: Map<string, any> = new Map();

  // Subscribe to all deployment changes
  subscribeToAll(callback: (payload: { new: Deployment | null; old: Deployment | null }) => void) {
    const subscription = supabase
      .channel('deployments_changes')
      .on(
        'postgres_changes' as REALTIME_LISTEN_TYPES.SYSTEM,
        {
          event: '*',
          schema: 'public',
          table: 'deployments',
        },
        callback
      )
      .subscribe();

    this.subscriptions.set('all', subscription);
    return subscription;
  }

  // Subscribe to specific deployment changes
  subscribeToDeployment(id: string, callback: (payload: { new: Deployment | null; old: Deployment | null }) => void) {
    const subscription = supabase
      .channel(`deployment_${id}`)
      .on(
        'postgres_changes' as REALTIME_LISTEN_TYPES.SYSTEM,
        {
          event: '*',
          schema: 'public',
          table: 'deployments',
          filter: `id=eq.${id}`,
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(`deployment_${id}`, subscription);
    return subscription;
  }

  // Subscribe to new deployments only
  subscribeToNew(callback: (payload: { new: Deployment | null; old: Deployment | null }) => void) {
    const subscription = supabase
      .channel('deployments_new')
      .on(
        'postgres_changes' as REALTIME_LISTEN_TYPES.SYSTEM,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deployments',
        },
        callback
      )
      .subscribe();

    this.subscriptions.set('new', subscription);
    return subscription;
  }

  // Unsubscribe from all subscriptions
  unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      supabase.removeChannel(subscription);
    });
    this.subscriptions.clear();
  }

  // Unsubscribe from specific subscription
  unsubscribe(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(key);
    }
  }
} 