import { ParameterDefinitionsRepository } from '@eth-deployer/supabase';

export class DeploymentParameterEditorService {
  private parameterDefinitionsRepository: ParameterDefinitionsRepository;

  constructor() {
    this.parameterDefinitionsRepository = new ParameterDefinitionsRepository();
  }

  /**
   * Load all parameter definitions
   */
  async loadParameterDefinitions() {
    return this.parameterDefinitionsRepository.getAll();
  }

  /**
   * Get parameter definitions by category
   */
  getParameterCategories() {
    return {
      basic: ['TOKEN_NAME', 'TOKEN_SYMBOL', 'TOTAL_SUPPLY', 'DECIMALS'],
      taxes: ['INITIAL_BUY_TAX', 'INITIAL_SELL_TAX', 'FINAL_BUY_TAX', 'FINAL_SELL_TAX', 'TRANSFER_TAX'],
      trading: ['REDUCE_BUY_TAX_AT', 'REDUCE_SELL_TAX_AT', 'PREVENT_SWAP_BEFORE'],
      limits: ['MAX_TX_AMOUNT_PERCENT', 'MAX_WALLET_SIZE_PERCENT', 'TAX_SWAP_LIMIT_PERCENT', 'MAX_SWAP_LIMIT_PERCENT'],
      advanced: ['TAX_WALLET']
    };
  }

  /**
   * Get short parameter names for display
   */
  getShortParamName(paramKey: string): string {
    const shortNames: Record<string, string> = {
      'TOKEN_NAME': 'Name',
      'TOKEN_SYMBOL': 'Symbol',
      'TOTAL_SUPPLY': 'Supply',
      'DECIMALS': 'Decimals',
      'INITIAL_BUY_TAX': 'Initial Buy %',
      'INITIAL_SELL_TAX': 'Initial Sell %',
      'FINAL_BUY_TAX': 'Final Buy %',
      'FINAL_SELL_TAX': 'Final Sell %',
      'TRANSFER_TAX': 'Transfer %',
      'REDUCE_BUY_TAX_AT': 'Reduce Buy At',
      'REDUCE_SELL_TAX_AT': 'Reduce Sell At',
      'PREVENT_SWAP_BEFORE': 'Prevent Swap',
      'MAX_TX_AMOUNT_PERCENT': 'Max TX %',
      'MAX_WALLET_SIZE_PERCENT': 'Max Wallet %',
      'TAX_SWAP_LIMIT_PERCENT': 'Tax Swap %',
      'MAX_SWAP_LIMIT_PERCENT': 'Max Swap %',
      'TAX_WALLET': 'Tax Wallet'
    };
    return shortNames[paramKey] || paramKey.replace(/_/g, ' ');
  }

  /**
   * Calculate category completion status
   */
  calculateCategoryStatus(parameters: any[]): any {
    const categories: Record<string, { count: number; completed: boolean; total: number }> = {
      basic: { count: 0, completed: false, total: 4 },
      taxes: { count: 0, completed: false, total: 5 },
      trading: { count: 0, completed: false, total: 3 },
      limits: { count: 0, completed: false, total: 4 },
      advanced: { count: 0, completed: false, total: 1 }
    };

    const categoryParams = this.getParameterCategories();

    parameters.forEach(param => {
      const hasValue = param.current_value && param.current_value.trim() !== '';
      
      if (categoryParams.basic.includes(param.parameter_key)) {
        if (hasValue) categories.basic.count++;
      } else if (categoryParams.taxes.includes(param.parameter_key)) {
        if (hasValue) categories.taxes.count++;
      } else if (categoryParams.trading.includes(param.parameter_key)) {
        if (hasValue) categories.trading.count++;
      } else if (categoryParams.limits.includes(param.parameter_key)) {
        if (hasValue) categories.limits.count++;
      } else if (categoryParams.advanced.includes(param.parameter_key)) {
        if (hasValue) categories.advanced.count++;
      }
    });

    // Mark categories as completed
    Object.keys(categories).forEach(category => {
      categories[category].completed = categories[category].count === categories[category].total;
    });

    return categories;
  }

  /**
   * Get parameters for a specific category
   */
  getCategoryParams(category: string): string[] {
    const categories = this.getParameterCategories();
    return categories[category as keyof typeof categories] || [];
  }

  /**
   * Get parameter definition by key
   */
  async getParameterDefinition(paramKey: string) {
    const result = await this.parameterDefinitionsRepository.getByKey(paramKey);
    return result;
  }
} 