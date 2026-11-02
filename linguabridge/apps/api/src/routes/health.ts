import type { FastifyPluginAsync } from 'fastify';
import type { TranslationProvider } from '@linguabridge/shared-types';

export interface HealthRouteOptions {
  providers: TranslationProvider[];
}

export const healthRoutes: FastifyPluginAsync<HealthRouteOptions> = async (fastify, opts) => {
  fastify.get('/health', async (_req, reply) => {
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
  });
};
