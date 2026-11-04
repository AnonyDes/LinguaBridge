import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createLinguaBridgeMcpServer } from '../server';
import type { McpServerConfig } from '../types';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface StdioServerInstance {
  server: McpServer;
  transport: StdioServerTransport;
  close: () => Promise<void>;
}

export async function startStdioServer(config?: McpServerConfig): Promise<StdioServerInstance> {
  const server = createLinguaBridgeMcpServer(config);
  const transport = new StdioServerTransport();

  await server.connect(transport);

  return {
    server,
    transport,
    close: async () => {
      await server.close();
      await transport.close();
    },
  };
}
