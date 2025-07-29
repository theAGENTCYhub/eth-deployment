// src/bot/callbacks/index.ts

// Callback mapping system to handle short callback data
export class CallbackManager {
  private static callbackMap = new Map<string, { action: string; data: any }>();
  private static counter = 0;

  /**
   * Generate a short callback ID
   */
  static generateCallbackId(action: string, data: any): string {
    const id = `cb_${this.counter++}`;
    this.callbackMap.set(id, { action, data });
    return id;
  }

  /**
   * Get callback data by ID
   */
  static getCallbackData(callbackId: string): { action: string; data: any } | null {
    return this.callbackMap.get(callbackId) || null;
  }

  /**
   * Clear old callbacks (optional cleanup)
   */
  static clearOldCallbacks(): void {
    // Keep only last 1000 callbacks to prevent memory leaks
    if (this.callbackMap.size > 1000) {
      const entries = Array.from(this.callbackMap.entries());
      const toDelete = entries.slice(0, entries.length - 1000);
      toDelete.forEach(([key]) => this.callbackMap.delete(key));
    }
  }

  /**
   * Generate parameter editing callback
   */
  static generateParamCallback(templateId: string, parameter: string): string {
    return this.generateCallbackId('edit_param', { templateId, parameter });
  }

  /**
   * Generate confirm parameters callback
   */
  static generateConfirmCallback(templateId: string): string {
    return this.generateCallbackId('confirm_params', { templateId });
  }

  /**
   * Generate reset parameters callback
   */
  static generateResetCallback(templateId: string): string {
    return this.generateCallbackId('reset_params', { templateId });
  }

  /**
   * Generate back to parameters callback
   */
  static generateBackToParamsCallback(templateId: string): string {
    return this.generateCallbackId('back_to_params', { templateId });
  }

  /**
   * Generate template selection callback
   */
  static generateTemplateCallback(templateId: string): string {
    return this.generateCallbackId('select_template', { templateId });
  }

  /**
   * Generate contract detail callback
   */
  static generateContractDetailCallback(contractId: string): string {
    return this.generateCallbackId('contract_detail', { contractId });
  }

  /**
   * Generate contract remove callback
   */
  static generateContractRemoveCallback(contractId: string): string {
    return this.generateCallbackId('contract_remove', { contractId });
  }

  /**
   * Generate contract confirm remove callback
   */
  static generateContractConfirmRemoveCallback(contractId: string): string {
    return this.generateCallbackId('contract_confirm_remove', { contractId });
  }

  /**
   * Generate contract copy callback
   */
  static generateContractCopyCallback(contractId: string): string {
    return this.generateCallbackId('contract_copy', { contractId });
  }

  /**
   * Generate compressed callback data for contracts (under 20 chars)
   */
  static generateContractCallback(action: string, contractId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 3);
    const shortId = `c${timestamp}${random}`.substr(0, 20);
    
    // Store in callback map
    this.callbackMap.set(shortId, {
      action,
      data: { contractId }
    });
    
    return shortId;
  }

  /**
   * Resolve compressed contract callback data
   */
  static resolveContractCallback(shortId: string): { action: string; data: any } | null {
    return this.callbackMap.get(shortId) || null;
  }

  /**
   * Generate contracts page callback
   */
  static generateContractsPageCallback(page: number): string {
    return this.generateCallbackId('contracts_page', { page });
  }

  /**
   * Generate launch detail callback
   */
  static generateLaunchDetailCallback(launchId: string): string {
    return this.generateCallbackId('launch_detail', { launchId });
  }

  /**
   * Generate launch management callback
   */
  static generateLaunchManagementCallback(launchId: string): string {
    return this.generateCallbackId('launch_management', { launchId });
  }

  /**
   * Generate launch positions callback
   */
  static generateLaunchPositionsCallback(launchId: string): string {
    return this.generateCallbackId('launch_positions', { launchId });
  }

  /**
   * Generate launches page callback
   */
  static generateLaunchesPageCallback(page: number): string {
    return this.generateCallbackId('launches_page', { page });
  }

  /**
   * Generate position detail callback
   */
  static generatePositionDetailCallback(launchId: string, walletId: string): string {
    return this.generateCallbackId('position_detail', { launchId, walletId });
  }

  /**
   * Generate positions page callback
   */
  static generatePositionsPageCallback(launchId: string, page: number): string {
    return this.generateCallbackId('positions_page', { launchId, page });
  }

  /**
   * Generate trade callback
   */
  static generateTradeCallback(mode: 'buy' | 'sell', launchId: string, walletId: string, amount: string): string {
    return this.generateCallbackId('trade', { mode, launchId, walletId, amount });
  }

  /**
   * Generate position mode callback
   */
  static generatePositionModeCallback(mode: 'buy' | 'sell', launchId: string, walletId: string): string {
    return this.generateCallbackId('position_mode', { mode, launchId, walletId });
  }

  /**
   * Generate trade slippage callback
   */
  static generateTradeSlippageCallback(launchId: string, walletId: string): string {
    return this.generateCallbackId('trade_slippage', { launchId, walletId });
  }

  /**
   * Generate position refresh callback
   */
  static generatePositionRefreshCallback(launchId: string, walletId: string): string {
    return this.generateCallbackId('position_refresh', { launchId, walletId });
  }

  /**
   * Generate trade confirm callback
   */
  static generateTradeConfirmCallback(launchId: string, walletId: string, mode: 'buy' | 'sell', amount: string): string {
    return this.generateCallbackId('trade_confirm', { launchId, walletId, mode, amount });
  }

  /**
   * Generate trade cancel callback
   */
  static generateTradeCancelCallback(launchId: string, walletId: string): string {
    return this.generateCallbackId('trade_cancel', { launchId, walletId });
  }

  /**
   * Generate compressed parameter editing callback (under 20 chars)
   */
  static generateParamEditingCallback(action: string, instanceId: string, key?: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 3);
    const shortId = `p${timestamp}${random}`.substr(0, 20);
    
    this.callbackMap.set(shortId, {
      action,
      data: { instanceId, key }
    });
    
    return shortId;
  }

  /**
   * Generate compressed developer wallet selection callback (under 20 chars)
   */
  static generateDevWalletCallback(walletId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 3);
    const shortId = `w${timestamp}${random}`.substr(0, 20);
    
    this.callbackMap.set(shortId, {
      action: 'select_dev_wallet',
      data: { walletId }
    });
    
    return shortId;
  }

  /**
   * Resolve compressed parameter editing callback data
   */
  static resolveParamEditingCallback(shortId: string): { action: string; data: any } | null {
    return this.callbackMap.get(shortId) || null;
  }
} 

