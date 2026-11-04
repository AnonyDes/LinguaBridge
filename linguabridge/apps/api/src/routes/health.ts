import type { FastifyPluginAsync } from 'fastify';
import type { TranslationProvider } from '@linguabridge/shared-types';
import {
  HealthResponseSchema,
  Error500Schema,
  CURL_GET_HEALTH,
} from '../schemas/openapi-schemas';

export interface HealthRouteOptions {
  providers: TranslationProvider[];
}

export const healthRoutes: FastifyPluginAsync<HealthRouteOptions> = async (fastify, opts) => {
  const healthSchema = {
    tags: ['System'],
    summary: 'Service health check and provider readiness telemetry',
    description: `Returns system operational status, server uptime in seconds, and individual translation provider readiness and latency.\n\n### Interactive cURL\n\`\`\`bash\n${CURL_GET_HEALTH}\n\`\`\``,
    'x-codeSamples': [
      {
        lang: 'Shell',
        label: 'cURL',
        source: CURL_GET_HEALTH,
      },
    ],
    response: {
      200: HealthResponseSchema,
      503: HealthResponseSchema,
      500: Error500Schema,
    },
  };

  const handler = async (_req: any, reply: any) => {
    const providerHealthResults = await Promise.all(
      opts.providers.map(async (provider) => {
        try {
          const health = await provider.healthCheck();
          return { provider: provider.id, name: provider.name, ...health };
        } catch (err) {
          return {
            provider: provider.id,
            name: provider.name,
            healthy: false,
            latencyMs: 0,
            message: (err as Error).message,
          };
        }
      })
    );

    const isSystemHealthy = providerHealthResults.some((p) => p.healthy);

    return reply.status(isSystemHealthy ? 200 : 503).send({
      status: isSystemHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      providers: providerHealthResults,
    });
  };

  fastify.get('/health', { schema: healthSchema }, handler);
  fastify.get('/api/health', { schema: { ...healthSchema, hide: true } }, handler);
};
