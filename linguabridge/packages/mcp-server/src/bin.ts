#!/usr/bin/env node
import { startStdioServer } from './transports/stdio';
import { createSseServer } from './transports/sse';

function printHelp(): void {
  console.log(`
LinguaBridge Model Context Protocol (MCP) Server
Usage:
  linguabridge-mcp [options]

Options:
  --transport <type>     Transport type: stdio (default) or sse
  --port <number>        Port for SSE HTTP server (default: 3030)
  --host <string>        Host address for SSE server (default: 127.0.0.1)
  --packs <dir>          Custom path to national language packs directory
  -h, --help             Show this help message
  -v, --version          Show server version
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log('0.1.0');
    process.exit(0);
  }

  let transportType: 'stdio' | 'sse' = 'stdio';
  let port = 3030;
  let host = '127.0.0.1';
  let packsDir: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--transport' && args[i + 1]) {
      transportType = args[i + 1].toLowerCase() as 'stdio' | 'sse';
      i++;
    } else if (args[i] === '--port' && args[i + 1]) {
      port = parseInt(args[i + 1], 10) || 3030;
      i++;
    } else if (args[i] === '--host' && args[i + 1]) {
      host = args[i + 1];
      i++;
    } else if (args[i] === '--packs' && args[i + 1]) {
      packsDir = args[i + 1];
      i++;
    }
  }

  if (transportType === 'sse') {
    const sseServer = createSseServer({ port, host, packsDir });
    const { port: boundPort, host: boundHost } = await sseServer.listen();
    console.error(`LinguaBridge MCP SSE Server running at http://${boundHost}:${boundPort}/sse`);
    console.error(`POST messages endpoint at http://${boundHost}:${boundPort}/message`);

    const shutdown = async () => {
      console.error('Shutting down SSE server...');
      await sseServer.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } else {
    // stdio transport (default)
    await startStdioServer({ packsDir });
    // Process remains active listening on stdin
  }
}

main().catch((err) => {
  console.error('Fatal MCP Server error:', err);
  process.exit(1);
});
