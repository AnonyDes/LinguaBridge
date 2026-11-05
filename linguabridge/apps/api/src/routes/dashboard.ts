import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import type { AuditLoggerService } from '../services/audit-logger-service';
import type { ApiKeyService } from '../services/api-key-service';
import {
  DashboardStatsResponseSchema,
  Error500Schema,
  CURL_GET_DASHBOARD_STATS,
} from '../schemas/openapi-schemas';

export interface DashboardRouteOptions {
  auditLogger: AuditLoggerService;
  apiKeyService: ApiKeyService;
}

export const dashboardRoutes: FastifyPluginAsync<DashboardRouteOptions> = async (fastify, opts) => {
  const { auditLogger, apiKeyService } = opts;

  const getStatsSchema = {
    tags: ['Dashboard'],
    summary: 'Real-time developer dashboard telemetry and metrics',
    description: `Provides real-time aggregated metrics: total translation requests, sovereign language distribution across the 5 Cameroonian languages, active and revoked API keys, average latency, and financial drift alerts.\n\n### Interactive cURL\n\`\`\`bash\n${CURL_GET_DASHBOARD_STATS}\n\`\`\``,
    'x-codeSamples': [
      {
        lang: 'Shell',
        label: 'cURL',
        source: CURL_GET_DASHBOARD_STATS,
      },
    ],
    response: {
      200: DashboardStatsResponseSchema,
      500: Error500Schema,
    },
  };

  const getStatsHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
    const stats = auditLogger.getStats(apiKeyService);
    return reply.status(200).send(stats);
  };

  for (const prefix of ['/api/v1', '/v1']) {
    fastify.get(`${prefix}/dashboard/stats`, { schema: getStatsSchema }, getStatsHandler);
  }
};
