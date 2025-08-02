import { ParameterEditorService } from './parameter-editor.service';

export interface SourceExportResult {
  success: boolean;
  fileName?: string;
  fileContent?: string;
  error?: string;
}

export class SourceExportService {
  private parameterEditor = new ParameterEditorService();

  /**
   * Export source code for a deployed contract instance
   * @param instanceId Contract instance ID
   * @returns Source export result with file content
   */
  async exportSourceCode(instanceId: string): Promise<SourceExportResult> {
    try {
      // Get the contract instance using a public method
      const instanceResult = await this.parameterEditor.getInstanceById(instanceId);
      if (!instanceResult.success || !instanceResult.data) {
        return { success: false, error: 'Contract instance not found' };
      }

      const instance = instanceResult.data;
      
      // Generate filename based on contract name and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `${instance.name}_${timestamp}.sol`;

      // Get the final source code (should be the compiled version with actual values)
      const sourceCode = instance.source_code;
      
      if (!sourceCode) {
        return { success: false, error: 'Source code not available' };
      }

      return {
        success: true,
        fileName,
        fileContent: sourceCode
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Format source code for Telegram file upload
   * @param sourceCode The source code content
   * @param fileName The filename
   * @returns Formatted file object for Telegram
   */
  formatForTelegram(sourceCode: string, fileName: string): { source: Buffer; filename: string } {
    // Ensure the source code is properly encoded
    const buffer = Buffer.from(sourceCode, 'utf8');
    
    // Validate buffer size (Telegram has a 50MB limit for files)
    if (buffer.length > 50 * 1024 * 1024) {
      throw new Error('Source code file is too large for Telegram upload');
    }
    
    // Ensure filename has .sol extension
    const finalFileName = fileName.endsWith('.sol') ? fileName : `${fileName}.sol`;
    
    return {
      source: buffer,
      filename: finalFileName
    };
  }
} 