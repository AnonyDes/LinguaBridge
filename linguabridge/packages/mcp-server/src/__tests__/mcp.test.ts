import { describe, it, expect } from 'vitest';
import {
  createLinguaBridgeMcpServer,
  loadSupportedLanguages,
  loadGlossaryForLang,
  createSseServer,
} from '../index';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

describe('@linguabridge/mcp-server Specification & Tools Suite', () => {
  it('creates an MCP server instance with tools and resources', () => {
    const server = createLinguaBridgeMcpServer();
    expect(server).toBeDefined();
  });

  describe('Direct Client/Server Tool Invocations via In-Memory Transport', () => {
    async function setupClientServer() {
      const server = createLinguaBridgeMcpServer();
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

      const client = new Client(
        { name: 'test-client', version: '1.0.0' },
        { capabilities: {} }
      );

      await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
      ]);

      return { server, client, cleanup: async () => {
        await client.close();
        await server.close();
      }};
    }

    it('lists all 4 registered tools', async () => {
      const { client, cleanup } = await setupClientServer();
      try {
        const toolsResult = await client.listTools();
        const toolNames = toolsResult.tools.map((t) => t.name);

        expect(toolNames).toContain('translate_financial_text');
        expect(toolNames).toContain('verify_zero_drift');
        expect(toolNames).toContain('lookup_glossary');
        expect(toolNames).toContain('list_supported_languages');
      } finally {
        await cleanup();
      }
    });

    it('executes verify_zero_drift tool for identical monetary amounts (safe)', async () => {
      const { client, cleanup } = await setupClientServer();
      try {
        const result = await client.callTool({
          name: 'verify_zero_drift',
          arguments: {
            sourceText: 'Paiement de 10 000 FCFA',
            translatedText: 'Móni yá 10 000 FCFA',
          },
        });

        expect(result.content).toBeDefined();
        const content = JSON.parse((result.content[0] as any).text);
        expect(content.safe).toBe(true);
        expect(content.match).toBe(true);
        expect(content.violations.length).toBe(0);
        expect(content.sourceFingerprint).toBe(content.translatedFingerprint);
      } finally {
        await cleanup();
      }
    });

    it('executes verify_zero_drift tool and flags financial drift on corrupted amount (unsafe)', async () => {
      const { client, cleanup } = await setupClientServer();
      try {
        const result = await client.callTool({
          name: 'verify_zero_drift',
          arguments: {
            sourceText: 'Paiement de 10 000 FCFA',
            translatedText: 'Móni yá 1 000 FCFA', // drifted amount!
          },
        });

        expect(result.content).toBeDefined();
        const content = JSON.parse((result.content[0] as any).text);
        expect(content.safe).toBe(false);
        expect(content.match).toBe(false);
        expect(content.violations.length).toBeGreaterThan(0);
        expect(content.sourceFingerprint).not.toBe(content.translatedFingerprint);
      } finally {
        await cleanup();
      }
    });

    it('executes translate_financial_text tool with zero-drift AST verification', async () => {
      const { client, cleanup } = await setupClientServer();
      try {
        const result = await client.callTool({
          name: 'translate_financial_text',
          arguments: {
            text: 'Solde: 50 000 FCFA',
            targetLang: 'ewo-CM',
            sourceLang: 'fr',
            domain: 'financial',
          },
        });

        expect(result.content).toBeDefined();
        const content = JSON.parse((result.content[0] as any).text);
        expect(content.safe).toBe(true);
        expect(content.status).toBe('completed');
        expect(content.translatedText).toContain('50 000 FCFA');
        expect(content.entities.some((e: any) => e.type === 'amount')).toBe(true);
      } finally {
        await cleanup();
      }
    });

    it('executes lookup_glossary tool querying certified financial terms', async () => {
      const { client, cleanup } = await setupClientServer();
      try {
        const result = await client.callTool({
          name: 'lookup_glossary',
          arguments: {
            term: 'solde',
            lang: 'ewo-CM',
          },
        });

        expect(result.content).toBeDefined();
        const content = JSON.parse((result.content[0] as any).text);
        expect(content.query).toBe('solde');
        expect(content.total).toBeGreaterThan(0);
        expect(content.matches.some((m: any) => m.ewo)).toBe(true);
      } finally {
        await cleanup();
      }
    });

    it('executes list_supported_languages tool showing production approved vs quarantined', async () => {
      const { client, cleanup } = await setupClientServer();
      try {
        const result = await client.callTool({
          name: 'list_supported_languages',
          arguments: {
            includeQuarantined: true,
          },
        });

        expect(result.content).toBeDefined();
        const content = JSON.parse((result.content[0] as any).text);
        expect(content.languages.some((l: any) => l.code === 'ewo-CM' && l.status === 'production_approved')).toBe(true);
        expect(content.languages.some((l: any) => l.code === 'dua-CM' && l.status === 'not_installed')).toBe(true);
      } finally {
        await cleanup();
      }
    });

    it('lists and reads dynamic MCP resources', async () => {
      const { client, cleanup } = await setupClientServer();
      try {
        const resources = await client.listResources();
        expect(resources.resources.some((r) => r.uri.includes('linguabridge://languages'))).toBe(true);

        const readRes = await client.readResource({ uri: 'linguabridge://languages' });
        expect(readRes.contents).toBeDefined();
        const data = JSON.parse((readRes.contents[0] as any).text);
        expect(data.languages.length).toBeGreaterThan(0);
      } finally {
        await cleanup();
      }
    });
  });

  describe('Local Pack Loader & SSE Transport Integration', () => {
    it('loadSupportedLanguages returns certified Ewondo and quarantined templates', () => {
      const langs = loadSupportedLanguages(true);
      expect(langs.some((l) => l.code === 'ewo-CM' && l.qualityStatus === 'certified')).toBe(true);
      expect(langs.some((l) => l.code === 'dua-CM' && l.qualityStatus === 'unverified')).toBe(true);
    });

    it('loadGlossaryForLang returns certified terms for Ewondo', () => {
      const glossary = loadGlossaryForLang('ewo-CM');
      expect(glossary.terms).toBeDefined();
      expect(glossary.terms.length).toBeGreaterThan(0);
      expect(glossary.terms.some((g) => g.fr.toLowerCase().includes('solde'))).toBe(true);
    });

    it('creates SSE server transport without throwing', async () => {
      const sseServer = createSseServer({ port: 0 }); // free port
      const { port } = await sseServer.listen();
      expect(port).toBeGreaterThan(0);
      await sseServer.close();
    });
  });
});
