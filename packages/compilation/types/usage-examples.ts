/**
 * Usage Examples for Compilation API Types and Client
 * 
 * This file demonstrates how to use the TypeScript types and client
 * in your other packages for type-safe API interactions.
 */

import {
  CompilationClient,
  CompileRequest,
  CompileResponse,
  HealthResponse,
  isCompileSuccess,
  isCompileError,
  CompilationAPIError,
  CompilationAPIErrorType
} from './index';

// ============================================================================
// BASIC USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Basic compilation with type safety
 */
export async function basicCompilationExample() {
  const client = new CompilationClient();
  
  const request: CompileRequest = {
    sourceCode: `
      pragma solidity ^0.8.0;
      
      contract SimpleToken {
        string public name;
        uint256 public totalSupply;
        
        constructor(string memory _name, uint256 _totalSupply) {
          name = _name;
          totalSupply = _totalSupply;
        }
        
        function getInfo() public view returns (string memory, uint256) {
          return (name, totalSupply);
        }
      }
    `,
    contractName: 'SimpleToken'
  };

  try {
    const response: CompileResponse = await client.compile(request);
    
    if (isCompileSuccess(response)) {
      console.log('✅ Compilation successful!');
      console.log(`📄 ABI has ${response.abi.length} items`);
      console.log(`🔗 Bytecode length: ${response.bytecode.length}`);
      console.log(`🚀 Deployed bytecode length: ${response.deployedBytecode.length}`);
      
      // TypeScript knows these properties exist
      const abi = response.abi;
      const bytecode = response.bytecode;
      const deployedBytecode = response.deployedBytecode;
      
      return { abi, bytecode, deployedBytecode };
    } else {
      console.error('❌ Compilation failed:', response.error);
      return null;
    }
  } catch (error) {
    console.error('💥 API error:', error);
    return null;
  }
}

/**
 * Example 2: Health check
 */
export async function healthCheckExample() {
  const client = new CompilationClient();
  
  try {
    const health: HealthResponse = await client.health();
    console.log('🏥 Service health:', health.status);
    console.log('🔧 Compiler status:', health.compilerStatus);
    console.log('⏰ Last check:', health.timestamp);
    return health;
  } catch (error) {
    console.error('💥 Health check failed:', error);
    return null;
  }
}

// ============================================================================
// ADVANCED USAGE EXAMPLES
// ============================================================================

/**
 * Example 3: Custom configuration
 */
export async function customConfigExample() {
  const client = new CompilationClient({
    baseUrl: 'http://localhost:3001', // Custom URL
    timeout: 60000, // 60 second timeout
    headers: {
      'X-API-Key': 'your-api-key',
      'User-Agent': 'MyApp/1.0'
    }
  });
  
  const request: CompileRequest = {
    sourceCode: 'pragma solidity ^0.8.0; contract Test { }',
    contractName: 'Test'
  };
  
  return await client.compile(request);
}

/**
 * Example 4: Error handling with type guards
 */
export async function errorHandlingExample() {
  const client = new CompilationClient();
  
  const request: CompileRequest = {
    sourceCode: 'pragma solidity ^0.8.0; contract Broken { function broken() { this is invalid; } }',
    contractName: 'Broken'
  };
  
  try {
    const response = await client.compile(request);
    
    if (isCompileSuccess(response)) {
      // TypeScript knows this is a success response
      return {
        success: true,
        abi: response.abi,
        bytecode: response.bytecode,
        deployedBytecode: response.deployedBytecode
      };
    } else {
      // TypeScript knows this is an error response
      return {
        success: false,
        error: response.error
      };
    }
  } catch (error) {
    // Handle API errors (network, timeout, etc.)
    if (isCompilationAPIError(error)) {
      switch (error.type) {
        case CompilationAPIErrorType.NETWORK_ERROR:
          console.error('🌐 Network error:', error.message);
          break;
        case CompilationAPIErrorType.TIMEOUT_ERROR:
          console.error('⏰ Timeout error:', error.message);
          break;
        case CompilationAPIErrorType.VALIDATION_ERROR:
          console.error('❌ Validation error:', error.message);
          break;
        case CompilationAPIErrorType.COMPILATION_ERROR:
          console.error('🔨 Compilation error:', error.message);
          break;
        default:
          console.error('❓ Unknown error:', error.message);
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Example 5: Batch compilation
 */
export async function batchCompilationExample() {
  const client = new CompilationClient();
  
  const contracts: CompileRequest[] = [
    {
      sourceCode: 'pragma solidity ^0.8.0; contract Token { string public name; constructor(string memory _name) { name = _name; } }',
      contractName: 'Token'
    },
    {
      sourceCode: 'pragma solidity ^0.8.0; contract Storage { uint256 private value; function store(uint256 newValue) public { value = newValue; } function retrieve() public view returns (uint256) { return value; } }',
      contractName: 'Storage'
    }
  ];
  
  const results = await Promise.allSettled(
    contracts.map(contract => client.compile(contract))
  );
  
  const successful: CompileResponse[] = [];
  const failed: string[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      if (isCompileSuccess(result.value)) {
        successful.push(result.value);
        console.log(`✅ Contract ${index + 1} compiled successfully`);
      } else {
        failed.push(result.value.error);
        console.log(`❌ Contract ${index + 1} failed:`, result.value.error);
      }
    } else {
      failed.push(result.reason.message);
      console.log(`💥 Contract ${index + 1} error:`, result.reason.message);
    }
  });
  
  return { successful, failed };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Type guard for CompilationAPIError
 */
function isCompilationAPIError(error: unknown): error is CompilationAPIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error
  );
}

/**
 * Extract constructor parameters from ABI
 */
export function getConstructorParams(abi: any[]) {
  const constructor = abi.find(item => item.type === 'constructor');
  return constructor?.inputs || [];
}

/**
 * Extract function signatures from ABI
 */
export function getFunctionSignatures(abi: any[]) {
  return abi
    .filter(item => item.type === 'function')
    .map(item => ({
      name: item.name,
      inputs: item.inputs,
      outputs: item.outputs,
      stateMutability: item.stateMutability
    }));
}

/**
 * Extract event signatures from ABI
 */
export function getEventSignatures(abi: any[]) {
  return abi
    .filter(item => item.type === 'event')
    .map(item => ({
      name: item.name,
      inputs: item.inputs,
      anonymous: item.anonymous
    }));
} 