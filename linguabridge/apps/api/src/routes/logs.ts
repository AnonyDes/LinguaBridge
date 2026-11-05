import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { AuditLoggerService } from '../services/audit-logger-service';
import {
  AuditLogsResponseSchema,
  Error400Schema,
  Error500Schema,
  CURL_GET_LOGS,
} from '../schemas/openapi-schemas';

export interface LogsRouteOptions {
  auditLogger: AuditLoggerService;
}

const LogsQueryZodSchema = z.object({
  limit: z.coerce.number().min(1).max(200).optional(),
  offset: z.coerce.number().min(0).optional(),
  route: z.string().optional(),
  statusCode: z.coerce.number().optional(),
  keyId: z.string().optional(),
  driftOnly: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => (typeof val === 'string' ? val === 'true' : val)),
  sourceLang: z.string().optional(),
  targetLang: z.string().optional(),
});

export const logsRoutes: FastifyPluginAsync<LogsRouteOptions> = async (fastify, opts) => {
  const { auditLogger } = opts;

  const getLogsSchema = {
    tags: ['Audit Logs'],
    summary: 'Query developer audit logs with filtering',
    description: `Retrieves chronological execution logs, including response latency, status codes, preserved financial entities, and drift alerts.\n\n### Interactive cURL\n\`\`\`bash\n${CURL_GET_LOGS}\n\`\`\``,
    'x-codeSamples': [
      {
        lang: 'Shell',
        label: 'cURL',
        source: CURL_GET_LOGS,
      },
    ],
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max logs to return (1-200, default 50)', example: 50 },
        offset: { type: 'number', description: 'Offset for pagination', example: 0 },
        route: { type: 'string', description: 'Filter by route', example: '/v1/translate' },
        statusCode: { type: 'number', description: 'Filter by HTTP status code', example: 200 },
        keyId: { type: 'string', description: 'Filter by key ID' },
        driftOnly: { type: 'boolean', description: 'Filter only requests where financial drift was detected', example: false },
        sourceLang: { type: 'string', example: 'fr' },
        targetLang: { type: 'string', example: 'ewo-CM' },
      },
    },
    response: {
      200: AuditLogsResponseSchema,
      400: Error400Schema,
      500: Error500Schema,
    },
  };

  const getLogsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = LogsQueryZodSchema.safeParse(request.query);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid log query parameters',
        details: parseResult.error.issues,
      });
    }

    const filters = parseResult.data;
    const result = auditLogger.getLogs(filters);

    return reply.status(200).send(result);
  };

  for (const prefix of ['/api/v1', '/v1']) {
    fastify.get(`${prefix}/logs`, { schema: getLogsSchema }, getLogsHandler);
  }
};
