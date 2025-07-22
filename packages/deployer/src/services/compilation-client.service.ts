import { CompilationClient, CompileRequest, CompileResponse } from 'compilation';
import { CompiledArtifactsService } from '@eth-deployer/supabase';

export class CompilationClientService {
  private client: CompilationClient;

  constructor(config?: Partial<ConstructorParameters<typeof CompilationClient>[0]>) {
    this.client = new CompilationClient(config);
  }

  async compileContract(sourceCode: string, contractName: string): Promise<CompileResponse> {
    const request: CompileRequest = { sourceCode, contractName };
    return this.client.compile(request);
  }
} 