// Main exports
export { db } from './services/database.service';
export { DatabaseService } from './services/database.service';

// Service exports
export { DeploymentService } from './services/deployment.service';
export { ContractTemplateService } from './services/contract-template.service';

// Repository exports
export { DeploymentsRepository } from './repositories/deployments';
export { ContractTemplatesRepository } from './repositories/contract-templates';
export { ParameterDefinitionsRepository } from './repositories/parameter-definitions';
export { ContractInstancesRepository } from './repositories/contract-instances';

// Realtime exports
export { DeploymentsRealtime } from './realtime/deployments';

// Type exports
export type { Deployment, CreateDeployment, UpdateDeployment } from './repositories/deployments';
export type { 
  ContractTemplate, 
  CreateContractTemplate, 
  UpdateContractTemplate 
} from './repositories/contract-templates';
export type { 
  ParameterDefinition, 
  CreateParameterDefinition, 
  UpdateParameterDefinition 
} from './repositories/parameter-definitions';
export type { 
  ContractInstance, 
  CreateContractInstance, 
  UpdateContractInstance 
} from './repositories/contract-instances';
export type { ParameterValue } from './services/contract-template.service';

// Client exports
export { supabase, supabaseAdmin } from './client';
export type { Database } from './client';

// Config exports
export { config, isDevelopment, isProduction } from './config/env';

// Default export
export { db as default } from './services/database.service';

