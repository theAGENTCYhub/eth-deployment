import { CompilationServer } from './server';

async function main() {
  const port = parseInt(process.env.PORT || '3001', 10);
  
  try {
    const server = new CompilationServer(port);
    await server.start();
    
    // Graceful shutdown handling
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down compilation server...');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down compilation server...');
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start compilation server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
} 