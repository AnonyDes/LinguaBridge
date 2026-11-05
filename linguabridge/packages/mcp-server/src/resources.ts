import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadGlossaryForLang, loadSupportedLanguages } from './pack-loader';
import type { McpServerConfig } from './types';

export function registerResources(server: McpServer, config?: McpServerConfig): void {
  // Resource 1: Static / Dynamic language catalog
  server.resource(
    'languages',
    'linguabridge://languages',
    {
      description: 'Dynamic JSON list of all registered languages and certification statuses',
      mimeType: 'application/json',
    },
    async (uri) => {
      try {
        const languages = loadSupportedLanguages(true, config?.packsDir);
        const approved = languages.filter((l) => l.status === 'production_approved');
        const quarantined = languages.filter((l) => l.status !== 'production_approved');

        const payload = {
          uri: uri.href,
          generatedAt: new Date().toISOString(),
          total: languages.length,
          approvedCount: approved.length,
          quarantinedCount: quarantined.length,
          languages,
        };

        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(payload, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      } catch (err: any) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify({ error: message, languages: [] }, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      }
    }
  );

  // Resource 2: Glossary resource template for any language code
  server.resource(
    'glossary',
    new ResourceTemplate('linguabridge://glossary/{lang}', {
      list: async () => {
        const languages = loadSupportedLanguages(false, config?.packsDir);
        return {
          resources: languages.map((lang) => ({
            uri: `linguabridge://glossary/${lang.code}`,
            name: `${lang.name} Certified Financial Glossary`,
            mimeType: 'application/json',
            description: `Certified NACALCO / academic consensus financial dictionary for ${lang.name} (${lang.code})`,
          })),
        };
      },
    }),
    {
      description: 'Access to certified financial terminology dictionary for a specific language code (e.g. ewo-CM, fuv-CM, hau-CM, knc-CM, pcm-CM)',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      try {
        const rawLang = String(variables.lang || 'ewo-CM').trim();

        // Security check: validate code format to prevent path traversal
        if (!/^[a-zA-Z0-9_-]{2,15}$/.test(rawLang)) {
          return {
            contents: [
              {
                uri: uri.href,
                text: JSON.stringify({ error: 'Invalid language code format', terms: [] }, null, 2),
                mimeType: 'application/json',
              },
            ],
          };
        }

        const normLang = rawLang.toLowerCase().replace(/_/g, '-');
        if (normLang === 'dua-cm' || normLang === 'dua' || normLang === 'duala') {
          return {
            contents: [
              {
                uri: uri.href,
                text: JSON.stringify({
                  error: 'Duala is currently in quarantine (unverified for financial transactions)',
                  terms: [],
                  quarantined: true,
                }, null, 2),
                mimeType: 'application/json',
              },
            ],
          };
        }

        const { terms, provenance } = loadGlossaryForLang(rawLang, config?.packsDir);

        const payload = {
          uri: uri.href,
          language: rawLang,
          provenance: provenance || 'Certified national terminology consensus',
          termCount: terms.length,
          terms,
        };

        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(payload, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      } catch (err: any) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify({ error: message, terms: [] }, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      }
    }
  );
}
