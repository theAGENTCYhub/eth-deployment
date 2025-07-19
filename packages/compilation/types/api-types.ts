/**
 * TypeScript types for the Compilation API
 * 
 * Import these types in your other packages for type-safe API interactions:
 * 
 * ```typescript
 * import { CompileRequest, CompileResponse, HealthResponse } from './path/to/api-types';
 * ```
 */

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Request payload for contract compilation
 */
export interface CompileRequest {
  /** The Solidity source code to compile */
  sourceCode: string;
  /** The name of the contract class in the source code */
  contractName: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * ABI item structure for contract functions, events, etc.
 */
export interface ABIItem {
  /** Type of the ABI item */
  type: 'function' | 'constructor' | 'event' | 'fallback' | 'receive';
  /** Name of the function/event (not present for constructor) */
  name?: string;
  /** Input parameters */
  inputs: ABIParameter[];
  /** Output parameters (only for functions) */
  outputs?: ABIParameter[];
  /** State mutability */
  stateMutability?: 'view' | 'pure' | 'nonpayable' | 'payable';
  /** Whether the function is anonymous (for events) */
  anonymous?: boolean;
}

/**
 * ABI parameter structure
 */
export interface ABIParameter {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: string;
  /** Internal type (for complex types) */
  internalType?: string;
  /** Whether the parameter is indexed (for events) */
  indexed?: boolean;
  /** Array of components (for tuple types) */
  components?: ABIParameter[];
}

/**
 * Successful compilation response
 */
export interface CompileSuccessResponse {
  success: true;
  /** Contract Application Binary Interface */
  abi: ABIItem[];
  /** Full bytecode including constructor - use for deployment */
  bytecode: string;
  /** Runtime bytecode without constructor - use for verification */
  deployedBytecode: string;
}

/**
 * Failed compilation response
 */
export interface CompileErrorResponse {
  success: false;
  /** Error message describing the compilation failure */
  error: string;
}

/**
 * Union type for compilation response
 */
export type CompileResponse = CompileSuccessResponse | CompileErrorResponse;

/**
 * Health check response
 */
export interface HealthResponse {
  /** Service health status */
  status: 'healthy' | 'unhealthy';
  /** Service name */
  service: string;
  /** Compiler status */
  compilerStatus: string;
  /** Timestamp of the health check */
  timestamp: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type guard to check if compilation was successful
 */
export function isCompileSuccess(response: CompileResponse): response is CompileSuccessResponse {
  return response.success === true;
}

/**
 * Type guard to check if compilation failed
 */
export function isCompileError(response: CompileResponse): response is CompileErrorResponse {
  return response.success === false;
}

/**
 * Contract artifact structure (complete Hardhat artifact)
 */
export interface ContractArtifact {
  _format: string;
  contractName: string;
  sourceName: string;
  abi: ABIItem[];
  bytecode: string;
  deployedBytecode: string;
  linkReferences: Record<string, any>;
  deployedLinkReferences: Record<string, any>;
}

// ============================================================================
// API CLIENT TYPES
// ============================================================================

/**
 * Configuration for the compilation API client
 */
export interface CompilationAPIConfig {
  /** Base URL of the compilation API */
  baseUrl: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Additional headers to include in requests */
  headers?: Record<string, string>;
}

/**
 * Compilation API client interface
 */
export interface CompilationAPIClient {
  /**
   * Check the health of the compilation service
   */
  health(): Promise<HealthResponse>;
  
  /**
   * Compile a Solidity contract
   */
  compile(request: CompileRequest): Promise<CompileResponse>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Compilation API error types
 */
export enum CompilationAPIErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  COMPILATION_ERROR = 'COMPILATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Compilation API error
 */
export interface CompilationAPIError {
  type: CompilationAPIErrorType;
  message: string;
  statusCode?: number;
  originalError?: Error;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default API configuration
 */
export const DEFAULT_API_CONFIG: CompilationAPIConfig = {
  baseUrl: 'http://compilation-api:3001',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
};

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  HEALTH: '/health',
  COMPILE: '/compile'
} as const; 