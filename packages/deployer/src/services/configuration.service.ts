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
} 