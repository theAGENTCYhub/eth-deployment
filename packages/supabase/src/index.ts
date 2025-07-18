// Main exports
export { db } from './services/database.service';
export { DatabaseService } from './services/database.service';

// Service exports
export { DeploymentService } from './services/deployment.service';

// Repository exports
export { DeploymentsRepository } from './repositories/deployments';

// Realtime exports
export { DeploymentsRealtime } from './realtime/deployments';

// Type exports
export type { Deployment, CreateDeployment, UpdateDeployment } from './repositories/deployments';

// Client exports
export { supabase, supabaseAdmin } from './client';
export type { Database } from './client';

// Config exports
export { config, isDevelopment, isProduction } from './config/env';

// Default export
export { db as default } from './services/database.service';

