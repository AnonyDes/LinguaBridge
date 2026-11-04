import http from 'node:http';
import { URL } from 'node:url';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createLinguaBridgeMcpServer } from '../server';
import type { McpServerConfig } from '../types';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface SseServerOptions extends McpServerConfig {
  port?: number;
  host?: string;
  ssePath?: string;
  messagePath?: string;
}

export interface SseServerInstance {
  server: McpServer;
  httpServer: http.Server;
  port: number;
  host: string;
  listen: () => Promise<{ port: number; host: string }>;
  close: () => Promise<void>;
  getActiveSessionsCount: () => number;
}

export function createSseServer(options?: SseServerOptions): SseServerInstance {
  const ssePath = options?.ssePath || '/sse';
  const messagePath = options?.messagePath || '/message';
  const port = options?.port || 3030;
  const host = options?.host || '127.0.0.1';

  const mcpServer = createLinguaBridgeMcpServer(options);
  const activeTransports = new Map<string, SSEServerTransport>();

  const httpServer = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = reqUrl.pathname;

    // Health check endpoint
    if (pathname === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          service: 'linguabridge-mcp-sse',
          version: options?.version || '0.1.0',
          activeSessions: activeTransports.size,
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    // SSE Stream endpoint
    if (pathname === ssePath && req.method === 'GET') {
      try {
        const transport = new SSEServerTransport(messagePath, res);
        activeTransports.set(transport.sessionId, transport);

        transport.onclose = () => {
          activeTransports.delete(transport.sessionId);
        };

        await mcpServer.connect(transport);
      } catch (err: any) {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to establish SSE transport', details: String(err) }));
        }
      }
      return;
    }

    // Message receiver endpoint (client sends JSON-RPC frames here)
    if (pathname === messagePath && req.method === 'POST') {
      const sessionId = reqUrl.searchParams.get('sessionId');
      if (!sessionId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing sessionId query parameter in POST message' }));
        return;
      }

      const transport = activeTransports.get(sessionId);
      if (!transport) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Session not found: ${sessionId}` }));
        return;
      }

      try {
        await transport.handlePostMessage(req, res);
      } catch (err: any) {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error handling POST message', details: String(err) }));
        }
      }
      return;
    }

    // 404 Not Found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found', pathname }));
  });

  return {
    server: mcpServer,
    httpServer,
    port,
    host,
    getActiveSessionsCount: () => activeTransports.size,
    listen: () =>
      new Promise<{ port: number; host: string }>((resolve, reject) => {
        httpServer.listen(port, host, () => {
          const addr = httpServer.address();
          const actualPort = typeof addr === 'object' && addr ? addr.port : port;
          resolve({ port: actualPort, host });
        });
        httpServer.once('error', reject);
      }),
    close: async () => {
      for (const [id, transport] of activeTransports.entries()) {
        try {
          await transport.close();
        } catch {
          // Ignore close errors
        }
      }
      activeTransports.clear();
      await mcpServer.close();

      return new Promise<void>((resolve, reject) => {
        if (!httpServer.listening) {
          resolve();
          return;
        }
        httpServer.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    },
  };
}
