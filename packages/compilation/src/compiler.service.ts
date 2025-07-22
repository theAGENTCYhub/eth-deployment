import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { HardhatConfig } from 'hardhat/types/config';
import * as hre from 'hardhat';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CompileRequest, CompileResponse } from './api-types';

export class CompilerService {
  private contractsDir: string;
  private artifactsDir: string;

  constructor() {
    this.contractsDir = path.join(process.cwd(), 'contracts');
    this.artifactsDir = path.join(process.cwd(), 'artifacts');
  }

  async compileContract(request: CompileRequest): Promise<CompileResponse> {
    const tempFileName = `${request.contractName}_${uuidv4()}.sol`;
    const tempFilePath = path.join(this.contractsDir, tempFileName);

    try {
      // Ensure contracts directory exists
      await fs.ensureDir(this.contractsDir);

      // Write source code to temporary file
      await fs.writeFile(tempFilePath, request.sourceCode, 'utf8');

      // Compile using Hardhat
      const compilationResult = await this.performCompilation(request.contractName);

      // Clean up temporary file
      await this.cleanupTempFile(tempFilePath);

      return compilationResult;
    } catch (error) {
      // Clean up temporary file in case of error
      await this.cleanupTempFile(tempFilePath);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown compilation error'
      };
    }
  }

  private async performCompilation(contractName: string): Promise<CompileResponse> {
    try {
      // Run Hardhat compilation
      await hre.run('compile');

      // Find the compiled artifact by searching for the contract name in the artifacts directory
      const contractsDir = path.join(this.artifactsDir, 'contracts');
      const contractFiles = await fs.readdir(contractsDir);
      
      let artifactPath: string | null = null;
      
      for (const file of contractFiles) {
        if (file.endsWith('.sol')) {
          const potentialArtifactPath = path.join(contractsDir, file, `${contractName}.json`);
          if (await fs.pathExists(potentialArtifactPath)) {
            artifactPath = potentialArtifactPath;
            break;
          }
        }
      }
      
      if (!artifactPath) {
        throw new Error(`Contract artifact not found for ${contractName}`);
      }

      const artifact = await fs.readJson(artifactPath);
      
      return {
        success: true,
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        deployedBytecode: artifact.deployedBytecode
      };
    } catch (error) {
      throw new Error(`Compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }
    } catch (error) {
      console.warn(`Failed to cleanup temporary file ${filePath}:`, error);
    }
  }

  async getCompilationStatus(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ready',
      timestamp: new Date().toISOString()
    };
  }
} 