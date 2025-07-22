/**
 * TypeScript client for the Compilation API
 * 
 * Usage example:
 * ```typescript
 * import { CompilationClient } from './compilation-client';
 * 
 * const client = new CompilationClient();
 * const result = await client.compile({
 *   sourceCode: 'pragma solidity ^0.8.0; contract MyToken { ... }',
 *   contractName: 'MyToken'
 * });
 * 
 * if (result.success) {
 *   console.log('ABI:', result.abi);
 *   console.log('Bytecode:', result.bytecode);
 *   console.log('Deployed Bytecode:', result.deployedBytecode);
 * } else {
 *   console.error('Compilation failed:', result.error);
 * }
 * ```
 */

import {
  CompileRequest,
  CompileResponse,
  HealthResponse,
  CompilationAPIConfig,
  CompilationAPIClient,
  CompilationAPIError,
  CompilationAPIErrorType,
  DEFAULT_API_CONFIG,
  API_ENDPOINTS,
  isCompileSuccess,
  isCompileError
} from './api-types';

export class CompilationClient implements CompilationAPIClient {
  private config: CompilationAPIConfig;

  constructor(config: Partial<CompilationAPIConfig> = {}) {
    this.config = { ...DEFAULT_API_CONFIG, ...config };
  }

  /**
   * Check the health of the compilation service
   */
  async health(): Promise<HealthResponse> {
    try {
      const response = await this.makeRequest<HealthResponse>(
        'GET',
        API_ENDPOINTS.HEALTH
      );
      return response;
    } catch (error) {
      throw this.handleError(error, 'Health check failed');
    }
  }

  /**
   * Compile a Solidity contract
   */
  async compile(request: CompileRequest): Promise<CompileResponse> {
    try {
      // Validate request
      this.validateCompileRequest(request);

      const response = await this.makeRequest<CompileResponse>(
        'POST',
        API_ENDPOINTS.COMPILE,
        request
      );

      return response;
    } catch (error) {
      throw this.handleError(error, 'Compilation failed');
    }
  }

  /**
   * Make an HTTP request to the compilation API
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    body?: any
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        ...this.config.headers,
        ...(body && { 'Content-Type': 'application/json' })
      },
      ...(body && { body: JSON.stringify(body) })
    };

    // Add timeout if specified
    if (this.config.timeout) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      options.signal = controller.signal;
      
      try {
        const response = await fetch(url, options);
        clearTimeout(timeoutId);
        return await this.handleResponse<T>(response);
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } else {
      const response = await fetch(url, options);
      return await this.handleResponse<T>(response);
    }
  }

  /**
   * Handle the HTTP response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorBody = await response.json() as { error?: string };
        if (errorBody && typeof errorBody === 'object' && 'error' in errorBody && typeof errorBody.error === 'string') {
          errorMessage = errorBody.error;
        }
      } catch {
        // Ignore JSON parsing errors for error responses
      }

      const apiError: CompilationAPIError = {
        type: this.getErrorType(response.status),
        message: errorMessage,
        statusCode: response.status
      };

      throw apiError;
    }

    try {
      return await response.json() as T;
    } catch (error) {
      throw {
        type: CompilationAPIErrorType.UNKNOWN_ERROR,
        message: 'Failed to parse response JSON',
        originalError: error as Error
      } as CompilationAPIError;
    }
  }

  /**
   * Validate compilation request
   */
  private validateCompileRequest(request: CompileRequest): void {
    if (!request.sourceCode || typeof request.sourceCode !== 'string') {
      throw {
        type: CompilationAPIErrorType.VALIDATION_ERROR,
        message: 'sourceCode is required and must be a string'
      } as CompilationAPIError;
    }

    if (!request.contractName || typeof request.contractName !== 'string') {
      throw {
        type: CompilationAPIErrorType.VALIDATION_ERROR,
        message: 'contractName is required and must be a string'
      } as CompilationAPIError;
    }

    if (request.sourceCode.trim().length === 0) {
      throw {
        type: CompilationAPIErrorType.VALIDATION_ERROR,
        message: 'sourceCode cannot be empty'
      } as CompilationAPIError;
    }
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown, defaultMessage: string): CompilationAPIError {
    if (this.isCompilationAPIError(error)) {
      return error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          type: CompilationAPIErrorType.TIMEOUT_ERROR,
          message: 'Request timed out',
          originalError: error
        };
      }

      if (error.message.includes('fetch')) {
        return {
          type: CompilationAPIErrorType.NETWORK_ERROR,
          message: 'Network error occurred',
          originalError: error
        };
      }

      return {
        type: CompilationAPIErrorType.UNKNOWN_ERROR,
        message: error.message || defaultMessage,
        originalError: error
      };
    }

    return {
      type: CompilationAPIErrorType.UNKNOWN_ERROR,
      message: defaultMessage,
      originalError: error as Error
    };
  }

  /**
   * Get error type based on HTTP status code
   */
  private getErrorType(statusCode: number): CompilationAPIErrorType {
    switch (statusCode) {
      case 400:
        return CompilationAPIErrorType.VALIDATION_ERROR;
      case 500:
        return CompilationAPIErrorType.COMPILATION_ERROR;
      default:
        return CompilationAPIErrorType.UNKNOWN_ERROR;
    }
  }

  /**
   * Type guard for CompilationAPIError
   */
  private isCompilationAPIError(error: unknown): error is CompilationAPIError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      'message' in error
    );
  }
}

// Export utility functions for type checking
export { isCompileSuccess, isCompileError };

// Export default client instance
export const compilationClient = new CompilationClient(); 