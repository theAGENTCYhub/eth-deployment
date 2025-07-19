export interface CompileRequest {
  sourceCode: string;
  contractName: string;
}

export interface CompileResponse {
  success: boolean;
  abi?: any[];
  bytecode?: string;
  deployedBytecode?: string;
  error?: string;
}

export interface CompilationArtifact {
  abi: any[];
  bytecode: string;
  contractName: string;
} 