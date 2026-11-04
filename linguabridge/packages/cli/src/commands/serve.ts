import { startMockServer, type MockServerInstance } from '../server';
import { printError, printSuccess } from '../utils/output';

export interface ServeOptions {
  port?: number | string;
  host?: string;
  exit?: boolean;
}

export async function runServe(options: ServeOptions = {}): Promise<MockServerInstance | null> {
  const port = options.port ? parseInt(String(options.port), 10) : 3030;
  const host = options.host || '127.0.0.1';

  try {
    const instance = await startMockServer(port, host);

    printSuccess(`LinguaBridge local mock server listening on ${instance.url}`);
    console.log('\n--- LinguaBridge Offline Translation Mock Server ---');
    console.log(`URL:    ${instance.url}`);
    console.log('Mode:   Offline / Zero External Dependency (Fixture & Ewondo Lexicon)');
    console.log('\nAvailable Endpoints:');
    console.log('  POST /v1/translate  - Offline financial translation with zero-drift AST');
    console.log('  GET  /v1/languages  - Supported sovereign languages listing');
    console.log('  POST /v1/verify     - Standalone cryptographic AST zero-drift verification');
    console.log('  GET  /health        - Service readiness & uptime check');
    console.log('----------------------------------------------------');
    console.log('Press Ctrl+C to stop the server.\n');

    return instance;
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === 'EADDRINUSE') {
      printError(`Port ${port} is already in use. Try specifying a different port: lb serve --port ${port + 1}`);
    } else {
      printError(`Failed to start mock server: ${error.message}`);
    }

    process.exitCode = 1;
    if (options.exit !== false && !process.env.VITEST) {
      process.exit(1);
    }
    return null;
  }
}
