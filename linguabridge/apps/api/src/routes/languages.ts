import type { FastifyPluginAsync } from 'fastify';
import type { LanguageRegistry } from '@linguabridge/language-registry';
import {
  LanguagesListResponseSchema,
  LanguageItemSchema,
  Error404Schema,
  Error500Schema,
  CURL_GET_LANGUAGES,
  CURL_GET_LANGUAGE_DETAIL,
} from '../schemas/openapi-schemas';

export interface LanguageRouteOptions {
  registry: LanguageRegistry;
}

export const languageRoutes: FastifyPluginAsync<LanguageRouteOptions> = async (fastify, opts) => {
  const languagesListSchema = {
    tags: ['Languages'],
    summary: 'List all certified production languages',
    description: `Lists all approved and certified sovereign language packs currently active for translation queries. Unreviewed templates are strictly quarantined.\n\n### Interactive cURL\n\`\`\`bash\n${CURL_GET_LANGUAGES}\n\`\`\``,
    'x-codeSamples': [
      {
        lang: 'Shell',
        label: 'cURL',
        source: CURL_GET_LANGUAGES,
      },
    ],
    response: {
      200: LanguagesListResponseSchema,
      500: Error500Schema,
    },
  };

  const languageDetailSchema = {
    tags: ['Languages'],
    summary: 'Get language details by ISO code or locale tag',
    description: `Retrieves metadata, speech synthesis readiness, and pack certification details for a sovereign language.\n\n### Interactive cURL\n\`\`\`bash\n${CURL_GET_LANGUAGE_DETAIL}\n\`\`\``,
    'x-codeSamples': [
      {
        lang: 'Shell',
        label: 'cURL',
        source: CURL_GET_LANGUAGE_DETAIL,
      },
    ],
    params: {
      type: 'object',
      required: ['code'],
      properties: {
        code: {
          type: 'string',
          description: 'ISO 639-1 code, ISO 639-3 code, or locale tag (e.g. ewo-CM, fr, ewo)',
          example: 'ewo-CM',
        },
      },
    },
    response: {
      200: LanguageItemSchema,
      404: Error404Schema,
      500: Error500Schema,
    },
  };

  const getLanguagesHandler = async (_request: any, reply: any) => {
    const languages = opts.registry.getAvailableLanguages();
    return reply.status(200).send({
      languages,
      count: languages.length,
    });
  };

  const getLanguageDetailHandler = async (request: any, reply: any) => {
    const { code } = request.params as { code: string };
    const languages = opts.registry.getAvailableLanguages();
    const lang = languages.find((l) => l.code === code || l.iso639_3 === code);

    if (!lang) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Language '${code}' is not an available production language.`,
      });
    }

    return reply.status(200).send(lang);
  };

  for (const prefix of ['/api/v1', '/v1']) {
    fastify.get(`${prefix}/languages`, { schema: languagesListSchema }, getLanguagesHandler);
    fastify.get(`${prefix}/languages/:code`, { schema: languageDetailSchema }, getLanguageDetailHandler);
  }
};
