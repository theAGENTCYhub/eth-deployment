import { ContractTemplatesRepository } from '../repositories/contract-templates';
import { ParameterDefinitionsRepository } from '../repositories/parameter-definitions';
import { ContractInstancesRepository } from '../repositories/contract-instances';

export interface ParameterValue {
	key: string;
	value: string;
}

export interface ParameterDefinition {
	key: string;
	name: string;
	dataType: 'string' | 'number' | 'boolean' | 'address';
	defaultValue?: string;
	validationRules?: {
		min?: number;
		max?: number;
		minLength?: number;
		maxLength?: number;
		pattern?: string;
	};
}

export interface ContractTemplate {
	id: string;
	name: string;
	description?: string;
	sourceCode: string;
	version: string;
	category?: string;
	tags?: string[];
}

export class ContractTemplateService {
	private templates: ContractTemplatesRepository;
	private parameterDefinitions: ParameterDefinitionsRepository;
	private contractInstances: ContractInstancesRepository;

	constructor() {
		this.templates = new ContractTemplatesRepository();
		this.parameterDefinitions = new ParameterDefinitionsRepository();
		this.contractInstances = new ContractInstancesRepository();
	}

	/**
	 * Load all available templates
	 */
	async loadTemplates(): Promise<{ success: boolean; data?: ContractTemplate[]; error?: string }> {
		try {
			const result = await this.templates.getAll();
			if (!result.success || !result.data) {
				return { success: false, error: result.error };
			}
			
			const templates = result.data.map(template => ({
				id: template.id,
				name: template.name,
				description: template.description || undefined,
				sourceCode: template.source_code,
				version: template.version,
				category: template.category || undefined,
				tags: template.tags || undefined
			}));

			return { success: true, data: templates };
		} catch (error) {
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	/**
	 * Load a specific template by ID
	 */
	async loadTemplate(templateId: string): Promise<{ success: boolean; data?: ContractTemplate; error?: string }> {
		try {
			const result = await this.templates.getById(templateId);
			if (!result.success || !result.data) {
				return { success: false, error: result.error };
			}

			const template = {
				id: result.data.id,
				name: result.data.name,
				description: result.data.description || undefined,
				sourceCode: result.data.source_code,
				version: result.data.version,
				category: result.data.category || undefined,
				tags: result.data.tags || undefined
			};

			return { success: true, data: template };
		} catch (error) {
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	/**
	 * Load parameter definitions
	 */
	async loadParameterDefinitions(): Promise<{ success: boolean; data?: ParameterDefinition[]; error?: string }> {
		try {
			const result = await this.parameterDefinitions.getAll();
			if (!result.success || !result.data) {
				return { success: false, error: result.error };
			}

			const definitions = result.data.map(def => ({
				key: def.parameter_key,
				name: def.parameter_name,
				dataType: def.data_type as 'string' | 'number' | 'boolean' | 'address',
				defaultValue: def.default_value || undefined,
				validationRules: def.validation_rules as ParameterDefinition['validationRules'] || undefined
			}));

			return { success: true, data: definitions };
		} catch (error) {
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	/**
	 * Discover parameters in a contract template
	 */
	discoverParameters(sourceCode: string): string[] {
		const placeholderRegex = /\{\{([^}]+)\}\}/g;
		const matches = [...sourceCode.matchAll(placeholderRegex)];
		const discoveredParams = [...new Set(matches.map(match => match[1]))];
		return discoveredParams.sort();
	}

	/**
	 * Replace parameters in source code
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
	 * Validate parameter values
	 */
	async validateParameters(parameters: ParameterValue[]): Promise<{ success: boolean; errors?: string[] }> {
		try {
			const definitionsResult = await this.loadParameterDefinitions();
			if (!definitionsResult.success || !definitionsResult.data) {
				return { success: false, errors: [definitionsResult.error || 'Failed to load parameter definitions'] };
			}

			const errors: string[] = [];
			const defMap = new Map(definitionsResult.data.map(d => [d.key, d]));

			for (const param of parameters) {
				const definition = defMap.get(param.key);
				if (!definition) {
					errors.push(`Unknown parameter: ${param.key}`);
					continue;
				}

				// Type validation
				switch (definition.dataType) {
					case 'number':
						if (isNaN(Number(param.value))) {
							errors.push(`${param.key} must be a valid number`);
						} else {
							const numValue = Number(param.value);
							if (definition.validationRules?.min !== undefined && numValue < definition.validationRules.min) {
								errors.push(`${param.key} must be at least ${definition.validationRules.min}`);
							}
							if (definition.validationRules?.max !== undefined && numValue > definition.validationRules.max) {
								errors.push(`${param.key} must be at most ${definition.validationRules.max}`);
							}
						}
						break;

					case 'string':
						if (definition.validationRules?.minLength !== undefined && param.value.length < definition.validationRules.minLength) {
							errors.push(`${param.key} must be at least ${definition.validationRules.minLength} characters`);
						}
						if (definition.validationRules?.maxLength !== undefined && param.value.length > definition.validationRules.maxLength) {
							errors.push(`${param.key} must be at most ${definition.validationRules.maxLength} characters`);
						}
						if (definition.validationRules?.pattern !== undefined) {
							const regex = new RegExp(definition.validationRules.pattern);
							if (!regex.test(param.value)) {
								errors.push(`${param.key} must match pattern: ${definition.validationRules.pattern}`);
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
	 * Save contract instance
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
	 */
	async getUserInstances(userId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
		try {
			const result = await this.contractInstances.getByUserId(userId);
			return { success: result.success, data: result.data, error: result.error };
		} catch (error) {
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	/**
	 * Update contract instance status
	 */
	async updateInstanceStatus(
		instanceId: string,
		status: string,
		compilationError?: string
	): Promise<{ success: boolean; error?: string }> {
		try {
			const result = await this.contractInstances.updateStatus(instanceId, status, compilationError);
			return { success: result.success, error: result.error };
		} catch (error) {
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	/**
	 * Generate comparison view
	 */
	generateComparison(
		originalCode: string,
		modifiedCode: string,
		parameters: ParameterValue[]
	): string {
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
} 