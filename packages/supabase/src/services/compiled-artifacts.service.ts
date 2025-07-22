import { CompiledArtifactsRepository } from '../repositories/compiled_artifacts';

export class CompiledArtifactsService {
  private repo: CompiledArtifactsRepository;

  constructor() {
    this.repo = new CompiledArtifactsRepository();
  }

  async createCompiledArtifact(data: {
    instance_id: string;
    artifacts: any;
    compilation_time_ms?: number;
    compiler_version?: string;
    created_at?: string;
  }) {
    return this.repo.create(data);
  }

  async getCompiledArtifactById(id: string) {
    return this.repo.getById(id);
  }

  async getCompiledArtifactsByInstanceId(instanceId: string) {
    return this.repo.getByInstanceId(instanceId);
  }

  async getAllCompiledArtifacts() {
    return this.repo.getAll();
  }

  async updateCompiledArtifact(id: string, data: Partial<{
    artifacts?: any;
    compilation_time_ms?: number;
    compiler_version?: string;
    created_at?: string;
  }>) {
    return this.repo.update(id, data);
  }

  async deleteCompiledArtifact(id: string) {
    return this.repo.delete(id);
  }
} 