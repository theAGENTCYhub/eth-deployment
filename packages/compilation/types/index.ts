/**
 * Compilation API - TypeScript Types and Client
 * 
 * This package provides type-safe interfaces and a client for interacting
 * with the Compilation API service.
 * 
 * @example
 * ```typescript
 * import { 
 *   CompilationClient, 
 *   CompileRequest, 
 *   CompileResponse,
 *   isCompileSuccess 
 * } from './types';
 * 
 * const client = new CompilationClient();
 * 
 * const request: CompileRequest = {
 *   sourceCode: 'pragma solidity ^0.8.0; contract MyToken { ... }',
 *   contractName: 'MyToken'
 * };
 * 
 * const response: CompileResponse = await client.compile(request);
 * 
 * if (isCompileSuccess(response)) {
 *   console.log('ABI:', response.abi);
 *   console.log('Bytecode:', response.bytecode);
 *   console.log('Deployed Bytecode:', response.deployedBytecode);
 * } else {
 *   console.error('Compilation failed:', response.error);
 * }
 * ```
 */

// Export all types
export * from './api-types';

// Export client
export { CompilationClient, compilationClient } from './compilation-client';

// Re-export utility functions for convenience
export { isCompileSuccess, isCompileError } from './api-types'; 