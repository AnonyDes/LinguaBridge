import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { ApiKeyService } from '../services/api-key-service';
import {
  CreateKeyRequestSchema,
  ApiKeyItemSchema,
  ApiKeysListResponseSchema,
  RevokeKeyResponseSchema,
  Error400Schema,
  Error404Schema,
  Error500Schema,
  CURL_POST_KEYS,
  CURL_GET_KEYS,
  CURL_REVOKE_KEY,
} from '../schemas/openapi-schemas';

export interface KeysRouteOptions {
  apiKeyService: ApiKeyService;
}

const CreateKeyZodSchema = z.object({
  name: z.string().min(1, 'API key name cannot be empty'),
  permissions: z.array(z.string()).optional(),
  quota: z.union([
    z.number().positive(),
    z.object({
      requestsPerMinute: z.number().positive().optional(),
      requestsPerDay: z.number().positive().optional(),
    }),
  ]).optional(),
  tenantId: z.string().optional(),
});

export const keysRoutes: FastifyPluginAsync<KeysRouteOptions> = async (fastify, opts) => {
  const { apiKeyService } = opts;

  const createKeySchema = {
    tags: ['API Keys'],
    summary: 'Provision a new API key with permissions and quotas',
    description: `Generates a cryptographic API key for tenant integration. The full secret token is returned once at creation; subsequent lookups only expose the key prefix.\n\n### Interactive cURL\n\`\`\`bash\n${CURL_POST_KEYS}\n\`\`\``,
    'x-codeSamples': [
      {
        lang: 'Shell',
        label: 'cURL',
        source: CURL_POST_KEYS,
      },
    ],
    body: CreateKeyRequestSchema,
    response: {
      201: ApiKeyItemSchema,
      400: Error400Schema,
      500: Error500Schema,
    },
  };

  const listKeysSchema = {
    tags: ['API Keys'],
    summary: 'List all provisioned and revoked API keys',
    description: `Lists all registered API keys along with their active/revoked lifecycle status, quotas, and last usage.\n\n### Interactive cURL\n\`\`\`bash\n${CURL_GET_KEYS}\n\`\`\``,
    'x-codeSamples': [
      {
        lang: 'Shell',
        label: 'cURL',
        source: CURL_GET_KEYS,
      },
    ],
    response: {
      200: ApiKeysListResponseSchema,
      500: Error500Schema,
    },
  };

  const revokeKeySchema = {
    tags: ['API Keys'],
    summary: 'Instantly revoke an API key',
    description: `Immediately invalidates the specified API key. Requests using a revoked key are instantly rejected with HTTP 401 Unauthorized.\n\n### Interactive cURL\n\`\`\`bash\n${CURL_REVOKE_KEY}\n\`\`\``,
    'x-codeSamples': [
      {
        lang: 'Shell',
        label: 'cURL',
        source: CURL_REVOKE_KEY,
      },
    ],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'Unique API key identifier to revoke',
          example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        },
      },
    },
    response: {
      200: RevokeKeyResponseSchema,
      404: Error404Schema,
      500: Error500Schema,
    },
  };

  // Handler: Create key
  const createKeyHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = CreateKeyZodSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid key creation payload',
        details: parseResult.error.issues,
      });
    }

    const created = apiKeyService.createKey(parseResult.data);
    return reply.status(201).send(created);
  };

  // Handler: List keys
  const listKeysHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
    const keys = apiKeyService.listKeys();
    return reply.status(200).send({
      keys,
      count: keys.length,
    });
  };

  // Handler: Revoke key
  const revokeKeyHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const revoked = apiKeyService.revokeKey(id);

    if (!revoked) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `API key with ID '${id}' not found.`,
      });
    }

    return reply.status(200).send({
      success: true,
      id,
      message: 'API key revoked successfully',
      status: 'revoked',
      key: revoked,
    });
  };

  for (const prefix of ['/api/v1', '/v1']) {
    fastify.post(`${prefix}/keys`, { schema: createKeySchema }, createKeyHandler);
    fastify.get(`${prefix}/keys`, { schema: listKeysSchema }, listKeysHandler);
    fastify.post(`${prefix}/keys/:id/revoke`, { schema: revokeKeySchema }, revokeKeyHandler);
    fastify.delete(`${prefix}/keys/:id`, { schema: revokeKeySchema }, revokeKeyHandler);
  }
};
