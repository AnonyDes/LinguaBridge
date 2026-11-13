import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ApiKeyRecord, ApiKeyService } from './api-key-service';

declare module 'fastify' {
  interface FastifyRequest {
    apiKey?: ApiKeyRecord;
  }
}

export function authorize(keys: ApiKeyService, scope: string, allowAnonymous = () => false) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers['x-api-key'] ?? request.headers.authorization;
    if (header === undefined && allowAnonymous()) return;
    const token = typeof header === 'string' ? header.replace(/^Bearer\s+/i, '').trim() : '';
    const { valid, key } = keys.validateKey(token);
    if (!valid || !key) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'API key revoked or invalid' });
    }
    if (!key.permissions.includes('*') && !key.permissions.includes(scope)) {
      return reply.code(403).send({ error: 'Forbidden', message: 'API key lacks the required permission' });
    }
    if (!keys.consumeQuota(key)) {
      return reply.code(429).send({ error: 'Too Many Requests', message: 'API key quota exceeded' });
    }
    request.apiKey = key;
  };
}
