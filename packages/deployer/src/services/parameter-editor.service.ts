import { ParameterValue } from '@eth-deployer/supabase';
import { ContractTemplatesRepository, ParameterDefinitionsRepository, ContractInstancesRepository } from '@eth-deployer/supabase';
import type { Database } from '@eth-deployer/supabase';

type ContractTemplate = Database['public']['Tables']['contract_templates']['Row'];
type ParameterDefinition = Database['public']['Tables']['parameter_definitions']['Row'];

export class ParameterEditorService {
  private templates: ContractTemplatesRepository;
  private parameterDefinitions: ParameterDefinitionsRepository;
  private contractInstances: ContractInstancesRepository;

  constructor() {
    this.templates = new ContractTemplatesRepository();
    this.parameterDefinitions = new ParameterDefinitionsRepository();
    this.contractInstances = new ContractInstancesRepository();
  }

  /**
   * Load contract template from database
   * @param templateId Template ID to load
   * @returns Contract template with source code
   */
  async loadTemplate(templateId: string): Promise<{ success: boolean; data?: ContractTemplate; error?: string }> {
    return await this.templates.getById(templateId);
  }

  /**
   * Load all available templates
   * @returns Array of available templates
   */
  async loadTemplates(): Promise<{ success: boolean; data?: ContractTemplate[]; error?: string }> {
    return await this.templates.getAll();
  }

  /**
   * Load parameter definitions from database
   * @returns Array of parameter definitions
   */
  async loadParameterDefinitions(): Promise<{ success: boolean; data?: ParameterDefinition[]; error?: string }> {
    return await this.parameterDefinitions.getAll();
  }

  /**
   * Discovers all parameters in a contract template
   * @param sourceCode The contract source code with placeholders
   * @returns Array of discovered parameter keys
   */
  discoverParameters(sourceCode: string): string[] {
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const matches = [...sourceCode.matchAll(placeholderRegex)];
    const discoveredParams = [...new Set(matches.map(match => match[1]))];
    return discoveredParams.sort();
  }

  /**
   * Replaces parameters in source code with provided values
   * @param sourceCode The original contract source code
   * @param parameters Array of parameter key-value pairs
   * @returns Modified source code with parameters replaced
   */
  replaceParameters(sourceCode: string, parameters: ParameterValue[]): string {
    let modifiedCode = sourceCode;
    
    for (const param of parameters) {
      const placeholder = `{{${param.key}}}`;
      modifiedCode = modifiedCode.replace(new RegExp(placeholder, 'g'), param.value);
    }
    
    return modifiedCode;
  }

  /**
   * Validates parameter values against their definitions
   * @param parameters Parameter values to validate
   * @returns Array of validation errors
   */
  async validateParameters(parameters: ParameterValue[]): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const definitionsResult = await this.loadParameterDefinitions();
      if (!definitionsResult.success || !definitionsResult.data) {
        return { success: false, errors: [definitionsResult.error || 'Failed to load parameter definitions'] };
      }

      const errors: string[] = [];
      const defMap = new Map(definitionsResult.data.map(d => [d.parameter_key, d]));

      for (const param of parameters) {
        const definition = defMap.get(param.key);
        if (!definition) {
          errors.push(`Unknown parameter: ${param.key}`);
          continue;
        }

        // Type validation
        switch (definition.data_type) {
          case 'number':
            if (isNaN(Number(param.value))) {
              errors.push(`${param.key} must be a valid number`);
            } else {
              const numValue = Number(param.value);
              const validationRules = definition.validation_rules as any;
              if (validationRules?.min !== undefined && numValue < validationRules.min) {
                errors.push(`${param.key} must be at least ${validationRules.min}`);
              }
              if (validationRules?.max !== undefined && numValue > validationRules.max) {
                errors.push(`${param.key} must be at most ${validationRules.max}`);
              }
            }
            break;

          case 'string':
            const validationRules = definition.validation_rules as any;
            if (validationRules?.minLength !== undefined && param.value.length < validationRules.minLength) {
              errors.push(`${param.key} must be at least ${validationRules.minLength} characters`);
            }
            if (validationRules?.maxLength !== undefined && param.value.length > validationRules.maxLength) {
              errors.push(`${param.key} must be at most ${validationRules.maxLength} characters`);
            }
            if (validationRules?.pattern !== undefined) {
              const regex = new RegExp(validationRules.pattern);
              if (!regex.test(param.value)) {
                errors.push(`${param.key} must match pattern: ${validationRules.pattern}`);
              }
            }
            break;

          case 'address':
            const addressRegex = /^0x[a-fA-F0-9]{40}$/;
            if (!addressRegex.test(param.value)) {
              errors.push(`${param.key} must be a valid Ethereum address`);
            }
            break;

          case 'boolean':
            if (!['true', 'false', '0', '1'].includes(param.value.toLowerCase())) {
              errors.push(`${param.key} must be a valid boolean value`);
            }
            break;
        }
      }

      return { success: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
    } catch (error) {
      return { success: false, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  /**
   * Generates a comparison view of before and after parameter replacement
   * @param originalCode Original contract source code
   * @param modifiedCode Modified contract source code
   * @param parameters Parameters that were replaced
   * @returns Formatted comparison string
   */
  generateComparison(originalCode: string, modifiedCode: string, parameters: ParameterValue[]): string {
    let comparison = '=== CONTRACT PARAMETER REPLACEMENT COMPARISON ===\n\n';
    
    comparison += 'PARAMETERS REPLACED:\n';
    comparison += '===================\n';
    for (const param of parameters) {
      comparison += `{{${param.key}}} → "${param.value}"\n`;
    }
    
    comparison += '\nORIGINAL CONTRACT (with placeholders):\n';
    comparison += '=====================================\n';
    comparison += originalCode;
    
    comparison += '\n\nMODIFIED CONTRACT (with values):\n';
    comparison += '================================\n';
    comparison += modifiedCode;
    
    return comparison;
  }

  /**
   * Save contract instance to database
   * @param userId Telegram user ID
   * @param templateId Template ID
   * @param name Contract instance name
   * @param parameters Parameter values
   * @param sourceCode Modified source code
   * @returns Contract instance ID
   */
  async saveContractInstance(
    userId: string,
    templateId: string,
    name: string,
    parameters: ParameterValue[],
    sourceCode: string
  ): Promise<{ success: boolean; instanceId?: string; error?: string }> {
    try {
      // Check if user already has an instance with this name
      const existingInstance = await this.contractInstances.getUserInstanceByName(userId, name);
      if (existingInstance.success && existingInstance.data) {
        return { success: false, error: 'You already have a contract instance with this name' };
      }

      const result = await this.contractInstances.create({
        template_id: templateId,
        user_id: userId,
        name,
        parameters: parameters.reduce((acc, param) => {
          acc[param.key] = param.value;
          return acc;
        }, {} as Record<string, string>),
        source_code: sourceCode,
        status: 'draft'
      });

      if (!result.success || !result.data) {
        return { success: false, error: result.error };
      }

      return { success: true, instanceId: result.data.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get user's contract instances
   * @param userId Telegram user ID
   * @returns Array of user's contract instances
   */
  async getUserInstances(userId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    return await this.contractInstances.getByUserId(userId);
  }

  /**
   * Update contract instance status
   * @param instanceId Contract instance ID
   * @param status New status
   * @param compilationError Optional compilation error message
   * @returns Success status
   */
  async updateInstanceStatus(
    instanceId: string,
    status: string,
    compilationError?: string
  ): Promise<{ success: boolean; error?: string }> {
    return await this.contractInstances.updateStatus(instanceId, status, compilationError);
  }

  // Add a public method to update parameters for a contract instance
  async updateInstanceParameters(instanceId: string, parameters: Record<string, string>) {
    return this.contractInstances.updateParameters(instanceId, parameters);
  }

  // Add a public method to get parameters for a contract instance as Record<string, string>
  async getInstanceParameters(instanceId: string): Promise<Record<string, string>> {
    const result = await this.contractInstances.getById(instanceId);
    if (result.success && result.data && typeof result.data.parameters === 'object' && result.data.parameters !== null) {
      // Only keep string values
      const params: Record<string, string> = {};
      for (const [k, v] of Object.entries(result.data.parameters)) {
        params[k] = typeof v === 'string' ? v : '';
      }
      return params;
    }
    return {};
  }

  // Add a public method to update source code for a contract instance
  async updateInstanceSourceCode(instanceId: string, sourceCode: string): Promise<{ success: boolean; error?: string }> {
    return await this.contractInstances.updateSourceCode(instanceId, sourceCode);
  }

  // Add a public method to get contract instance by ID
  async getInstanceById(instanceId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    return await this.contractInstances.getById(instanceId);
  }

  /**
   * Validate social media parameters specifically
   * @param parameters Parameter values to validate
   * @returns Array of validation errors for social media parameters
   */
  validateSocialMediaParameters(parameters: ParameterValue[]): { success: boolean; errors?: string[] } {
    const errors: string[] = [];
    const socialParams = ['TWITTER_LINK', 'WEBSITE_LINK', 'TELEGRAM_LINK'];
    
    for (const param of parameters) {
      if (socialParams.includes(param.key)) {
        const value = param.value;
        
        // Skip validation if value is empty (optional parameters)
        if (!value || value.trim() === '') {
          continue;
        }
        
        // Basic URL validation
        if (!value.startsWith('http://') && !value.startsWith('https://')) {
          errors.push(`${param.key} must be a valid URL starting with http:// or https://`);
        }
        
        // Platform-specific validation
        if (param.key === 'TWITTER_LINK' && !value.includes('x.com') && !value.includes('twitter.com')) {
          errors.push(`${param.key} should be a valid Twitter/X URL (x.com or twitter.com)`);
        }
        
        if (param.key === 'TELEGRAM_LINK' && !value.includes('t.me') && !value.includes('telegram.me')) {
          errors.push(`${param.key} should be a valid Telegram URL (t.me or telegram.me)`);
        }
      }
    }
    
    return { success: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  }

  /**
   * Get default values for social media parameters
   * @returns Object with default social media parameter values
   */
  getSocialMediaDefaults(): Record<string, string> {
    return {
      'TWITTER_LINK': 'https://x.com/elonmusk',
      'WEBSITE_LINK': 'https://google.com',
      'TELEGRAM_LINK': 'https://t.me/paveldurov'
    };
  }
} 