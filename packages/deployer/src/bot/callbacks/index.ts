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
   * Generate contracts page callback
   */
  static generateContractsPageCallback(page: number): string {
    return this.generateCallbackId('contracts_page', { page });
  }
} 

