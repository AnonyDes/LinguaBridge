import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from './tools';
import { registerResources } from './resources';
import type { McpServerConfig } from './types';

export function createLinguaBridgeMcpServer(config?: McpServerConfig): McpServer {
  const name = config?.name || 'linguabridge-mcp';
  const version = config?.version || '0.1.0';

  const server = new McpServer(
    {
      name,
      version,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  registerTools(server, config);
  registerResources(server, config);

  return server;
}
