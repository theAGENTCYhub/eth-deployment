// Main exports
export { db } from './services/database.service';
export { DatabaseService } from './services/database.service';

// Service exports
export { DeploymentService } from './services/deployment.service';
export { ContractTemplateService } from './services/contract-template.service';
export { CompiledArtifactsService } from './services/compiled-artifacts.service';
export { WalletService } from './services/wallet.service';
export { TransactionsService } from './services/transactions.service';
export { DeployedContractsService } from './services/deployed-contracts.service';
export { LaunchConfigsService } from './services/launch-configs.service';
export { BundleLaunchesService } from './services/bundle-launches.service';
export { DeploymentConfigsService } from './services/deployment-configs.service';
export { LiquidityConfigsService } from './services/liquidity-configs.service';
export { BundleConfigsService } from './services/bundle-configs.service';

// Repository exports
export { DeploymentsRepository } from './repositories/deployments';
export { ContractTemplatesRepository } from './repositories/contract-templates';
export { ParameterDefinitionsRepository } from './repositories/parameter-definitions';
export { ContractInstancesRepository } from './repositories/contract-instances';
export { TransactionsRepository } from './repositories/transactions';
export { BundleWalletsRepository } from './repositories/bundle-wallets';
export { PositionsRepository } from './repositories/positions';
export { DeploymentConfigsRepository } from './repositories/deployment-configs';
export { LiquidityConfigsRepository } from './repositories/liquidity-configs';
export { BundleConfigsRepository } from './repositories/bundle-configs';

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
export type { DeployedContract, DeployedContractDetail } from './services/deployed-contracts.service';
export type { DeploymentConfig, CreateDeploymentConfig, UpdateDeploymentConfig } from './repositories/deployment-configs';
export type { LiquidityConfig, CreateLiquidityConfig, UpdateLiquidityConfig } from './repositories/liquidity-configs';
export type { BundleConfig, CreateBundleConfig, UpdateBundleConfig } from './repositories/bundle-configs';

// Client exports
export { supabase, supabaseAdmin } from './client';
export type { Database } from './client';

// Config exports
export { config, isDevelopment, isProduction } from './config/env';

// Default export
export { db as default } from './services/database.service';

