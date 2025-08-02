declare global {
  // eslint-disable-next-line no-var
  var userConfigurations: Map<string, any>;
}

export interface SavedConfiguration {
  id: string;
  name: string;
  parameters: Record<string, string>;
  createdAt: Date;
  templateId: string;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ConfigurationService {
  /**
   * Save current parameter configuration
   */
  async saveConfiguration(
    userId: string, 
    configName: string, 
    instanceId: string,
    templateId: string
  ): Promise<ServiceResponse<SavedConfiguration>> {
    try {
      // Get current parameter values from instance
      const parameterEditor = new (require('./parameter-editor.service').ParameterEditorService)();
      const result = await parameterEditor.getInstanceParameters(instanceId);
      if (!result) {
        return { success: false, error: 'Failed to get current parameters' };
      }
      // result is Record<string, string>
      // Create configuration object
      const config: SavedConfiguration = {
        id: `config_${Date.now()}`,
        name: configName,
        parameters: result,
        createdAt: new Date(),
        templateId
      };
      // Store in user session or database
      if (!(global as any).userConfigurations) {
        (global as any).userConfigurations = new Map();
      }
      if (!(global as any).userConfigurations.has(userId)) {
        (global as any).userConfigurations.set(userId, []);
      }
      (global as any).userConfigurations.get(userId).push(config);
      return { success: true, data: config };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save configuration' 
      };
    }
  }
  
  /**
   * Load saved configuration
   */
  async loadConfiguration(
    userId: string, 
    configId: string, 
    instanceId: string
  ): Promise<ServiceResponse<void>> {
    try {
      const userConfigs = global.userConfigurations?.get(userId) || [];
      const config = userConfigs.find((c: SavedConfiguration) => c.id === configId);
      
      if (!config) {
        return { success: false, error: 'Configuration not found' };
      }
      
      // Apply configuration to current instance
      const parameterEditor = new (require('./parameter-editor.service').ParameterEditorService)();
      
      for (const [paramKey, value] of Object.entries(config.parameters)) {
        const updateResult = await parameterEditor.updateParameterValue(
          instanceId, 
          paramKey, 
          value
        );
        
        if (!updateResult.success) {
          console.warn(`Failed to update parameter ${paramKey}:`, updateResult.error);
        }
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to load configuration' 
      };
    }
  }
  
  /**
   * Get user's saved configurations
   */
  async getUserConfigurations(userId: string): Promise<ServiceResponse<SavedConfiguration[]>> {
    try {
      const userConfigs = global.userConfigurations?.get(userId) || [];
      return { success: true, data: userConfigs };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get configurations' 
      };
    }
  }

  /**
   * Load configuration with partial parameter support
   * Allows loading only specific parameter categories
   */
  async loadConfigurationPartial(
    userId: string, 
    configId: string, 
    instanceId: string,
    categories?: string[]
  ): Promise<ServiceResponse<void>> {
    try {
      const userConfigs = global.userConfigurations?.get(userId) || [];
      const config = userConfigs.find((c: SavedConfiguration) => c.id === configId);
      
      if (!config) {
        return { success: false, error: 'Configuration not found' };
      }
      
      // Apply configuration to current instance
      const parameterEditor = new (require('./parameter-editor.service').ParameterEditorService)();
      
      // Filter parameters by category if specified
      let parametersToLoad = config.parameters;
      if (categories && categories.length > 0) {
        const PARAMETER_CATEGORIES = {
          basic: ['TOKEN_NAME', 'TOKEN_SYMBOL', 'TOTAL_SUPPLY', 'DECIMALS'],
          taxes: ['INITIAL_BUY_TAX', 'INITIAL_SELL_TAX', 'FINAL_BUY_TAX', 'FINAL_SELL_TAX', 'TRANSFER_TAX'],
          trading: ['REDUCE_BUY_TAX_AT', 'REDUCE_SELL_TAX_AT', 'PREVENT_SWAP_BEFORE'],
          limits: ['MAX_TX_AMOUNT_PERCENT', 'MAX_WALLET_SIZE_PERCENT', 'TAX_SWAP_LIMIT_PERCENT', 'MAX_SWAP_LIMIT_PERCENT'],
          social: ['TWITTER_LINK', 'WEBSITE_LINK', 'TELEGRAM_LINK'],
          advanced: ['TAX_WALLET']
        };
        
        const allowedParams = categories.flatMap(cat => PARAMETER_CATEGORIES[cat as keyof typeof PARAMETER_CATEGORIES] || []);
        parametersToLoad = Object.fromEntries(
          Object.entries(config.parameters).filter(([key]) => allowedParams.includes(key))
        );
      }
      
      for (const [paramKey, value] of Object.entries(parametersToLoad)) {
        const updateResult = await parameterEditor.updateParameterValue(
          instanceId, 
          paramKey, 
          value
        );
        
        if (!updateResult.success) {
          console.warn(`Failed to update parameter ${paramKey}:`, updateResult.error);
        }
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to load configuration' 
      };
    }
  }

  /**
   * Validate configuration parameters
   * Checks if all required parameters are present and valid
   */
  async validateConfiguration(config: SavedConfiguration): Promise<ServiceResponse<{ isValid: boolean; errors: string[] }>> {
    try {
      const errors: string[] = [];
      
      // Check for required basic parameters
      const requiredBasic = ['TOKEN_NAME', 'TOKEN_SYMBOL', 'TOTAL_SUPPLY', 'DECIMALS'];
      for (const param of requiredBasic) {
        if (!config.parameters[param] || config.parameters[param].trim() === '') {
          errors.push(`Missing required parameter: ${param}`);
        }
      }
      
      // Check for social media parameters (optional but validate format if present)
      const socialParams = ['TWITTER_LINK', 'WEBSITE_LINK', 'TELEGRAM_LINK'];
      for (const param of socialParams) {
        const value = config.parameters[param];
        if (value && value.trim() !== '') {
          // Basic URL validation for social media links
          if (!value.startsWith('http://') && !value.startsWith('https://')) {
            errors.push(`Invalid ${param}: must be a valid URL starting with http:// or https://`);
          }
        }
      }
      
      return { 
        success: true, 
        data: { 
          isValid: errors.length === 0, 
          errors 
        } 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to validate configuration' 
      };
    }
  }

  /**
   * Get configuration summary with category breakdown
   */
  getConfigurationSummary(config: SavedConfiguration): { categories: any; totalParams: number; completedParams: number } {
    const PARAMETER_CATEGORIES = {
      basic: ['TOKEN_NAME', 'TOKEN_SYMBOL', 'TOTAL_SUPPLY', 'DECIMALS'],
      taxes: ['INITIAL_BUY_TAX', 'INITIAL_SELL_TAX', 'FINAL_BUY_TAX', 'FINAL_SELL_TAX', 'TRANSFER_TAX'],
      trading: ['REDUCE_BUY_TAX_AT', 'REDUCE_SELL_TAX_AT', 'PREVENT_SWAP_BEFORE'],
      limits: ['MAX_TX_AMOUNT_PERCENT', 'MAX_WALLET_SIZE_PERCENT', 'TAX_SWAP_LIMIT_PERCENT', 'MAX_SWAP_LIMIT_PERCENT'],
      social: ['TWITTER_LINK', 'WEBSITE_LINK', 'TELEGRAM_LINK'],
      advanced: ['TAX_WALLET']
    };
    
    const categories: any = {};
    let totalParams = 0;
    let completedParams = 0;
    
    for (const [category, params] of Object.entries(PARAMETER_CATEGORIES)) {
      const categoryParams = params as string[];
      let count = 0;
      
      for (const param of categoryParams) {
        totalParams++;
        if (config.parameters[param] && config.parameters[param].trim() !== '') {
          count++;
          completedParams++;
        }
      }
      
      categories[category] = {
        count,
        total: categoryParams.length,
        completed: count === categoryParams.length
      };
    }
    
    return { categories, totalParams, completedParams };
  }
} 