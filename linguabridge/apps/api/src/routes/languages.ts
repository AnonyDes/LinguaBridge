import type { FastifyPluginAsync } from 'fastify';
import type { LanguageRegistry } from '@linguabridge/language-registry';

export interface LanguageRouteOptions {
  registry: LanguageRegistry;
}

export const languageRoutes: FastifyPluginAsync<LanguageRouteOptions> = async (fastify, opts) => {
  // GET /v1/languages — returns only production_approved languages to public callers
  fastify.get('/v1/languages', async (_request, reply) => {
    const languages = opts.registry.getAvailableLanguages();
    return reply.status(200).send({
      languages,
      count: languages.length,
    });
  });

  // GET /v1/languages/:code — returns details if available
  fastify.get<{ Params: { code: string } }>('/v1/languages/:code', async (request, reply) => {
    const { code } = request.params;
    const languages = opts.registry.getAvailableLanguages();
    const lang = languages.find((l) => l.code === code || l.iso639_3 === code);

    if (!lang) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Language '${code}' is not an available production language.`,
      });
    }

    return reply.status(200).send(lang);
  });
};
