import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { CompilerService } from './compiler.service';
import { CompileRequest, CompileResponse } from './types';

export class CompilationServer {
  private app: express.Application;
  private compilerService: CompilerService;
  private port: number;

  constructor(port: number = 3001) {
    this.port = port;
    this.app = express();
    this.compilerService = new CompilerService();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS middleware
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type']
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const compilationStatus = await this.compilerService.getCompilationStatus();
        res.json({
          status: 'healthy',
          service: 'compilation-api',
          compilerStatus: compilationStatus.status,
          timestamp: compilationStatus.timestamp
        });
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Compilation endpoint
    this.app.post('/compile', async (req, res) => {
      try {
        const { sourceCode, contractName }: CompileRequest = req.body;

        // Validate request
        if (!sourceCode || !contractName) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: sourceCode and contractName'
          });
        }

        if (typeof sourceCode !== 'string' || typeof contractName !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'sourceCode and contractName must be strings'
          });
        }

        // Perform compilation
        const result: CompileResponse = await this.compilerService.compileContract({
          sourceCode,
          contractName
        });

        if (result.success) {
          res.json(result);
        } else {
          res.status(400).json(result);
        }
      } catch (error) {
        console.error('Compilation error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
      });
    });

    // Error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`🚀 Compilation API server running on port ${this.port}`);
        console.log(`📝 POST /compile - Compile Solidity contracts`);
        console.log(`🏥 GET /health - Health check`);
        resolve();
      });
    });
  }

  getApp(): express.Application {
    return this.app;
  }
} 