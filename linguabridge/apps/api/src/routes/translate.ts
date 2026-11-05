import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import type { TranslationPipeline } from '@linguabridge/translation-engine';
import type { TranslationRequest } from '@linguabridge/shared-types';
import { apiKeyService as defaultApiKeyService, type ApiKeyService } from '../services/api-key-service';
import {
  TranslateRequestSchema,
  TranslationResultSchema,
  BatchTranslateRequestSchema,
  BatchTranslateResponseSchema,
  AsyncBatchTranslateRequestSchema,
  AsyncBatchTranslateResponseSchema,
  ApiKeyHeaderSchema,
  Error400Schema,
  Error401Schema,
  Error500Schema,
  CURL_TRANSLATE,
  CURL_TRANSLATE_BATCH,
  CURL_TRANSLATE_ASYNC,
} from '../schemas/openapi-schemas';
import { webhookDispatcher } from '../webhooks/webhook-dispatcher';

export interface TranslateRouteOptions {
  pipeline: TranslationPipeline;
  apiKeyService?: ApiKeyService;
}

const TranslateBodyZodSchema = z.object({
  id: z.string().optional(),
  sourceText: z.string().min(1, 'sourceText cannot be empty'),
  sourceLang: z.string().min(2),
  targetLang: z.string().min(2),
  domain: z.enum(['financial', 'healthcare', 'government', 'general']).optional(),
  context: z.string().optional(),
  contentType: z.enum([
    'ui_label',
    'paragraph',
    'legal',
    'financial_amount',
    'financial_confirmation',
    'error_message',
    'notification',
  ]).optional(),
  providerPreference: z.string().optional(),
  tenantId: z.string().optional(),
  maxLatencyMs: z.number().positive().optional(),
  privacyPolicy: z.enum(['no_external', 'allow_external']).optional(),
  glossaryVersion: z.string().optional(),
  packVersion: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const translateRoutes: FastifyPluginAsync<TranslateRouteOptions> = async (fastify, opts) => {
  const apiKeyService = opts.apiKeyService || defaultApiKeyService;

  const authPreValidation = async (request: FastifyRequest, reply: FastifyReply) => {
    const rawHeader = request.headers['x-api-key'] || request.headers['authorization'];
    if (!rawHeader) {
      if (process.env.REQUIRE_API_KEY === 'true') {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'API key revoked or invalid',
        });
      }
      return;
    }

    let token = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    if (token.startsWith('Bearer ')) {
      token = token.slice(7).trim();
    } else {
      token = token.trim();
    }

    const validation = apiKeyService.validateKey(token);
    if (!validation.valid) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'API key revoked or invalid',
      });
    }

    (request as any).apiKey = validation.key;
  };

  const singleTranslateSchema = {
    tags: ['Translation'],
    summary: 'Translate text with financial zero-drift AST protection',
    description: `Translates source text into certified African sovereign languages (such as Ewondo ewo-CM) or international languages. For financial domains, cryptographic zero-drift AST analysis protects amounts, currencies, account numbers, and phone numbers.\n\n### Interactive cURL\n\`\`\`bash\n${CURL_TRANSLATE}\n\`\`\``,
    'x-codeSamples': [
      {
        lang: 'Shell',
        label: 'cURL',
        source: CURL_TRANSLATE,
      },
    ],
    headers: ApiKeyHeaderSchema,
    body: TranslateRequestSchema,
    response: {
      200: TranslationResultSchema,
      400: Error400Schema,
      401: Error401Schema,
      500: Error500Schema,
    },
  };

  const batchTranslateSchema = {
    tags: ['Translation'],
    summary: 'Synchronous batch translation (1 to 50 items)',
    description: `Translates an array of 1 to 50 items simultaneously with atomic financial entity preservation.\n\n### Interactive cURL\n\`\`\`bash\n${CURL_TRANSLATE_BATCH}\n\`\`\``,
    'x-codeSamples': [
      {
        lang: 'Shell',
        label: 'cURL',
        source: CURL_TRANSLATE_BATCH,
      },
    ],
    headers: ApiKeyHeaderSchema,
    body: BatchTranslateRequestSchema,
    response: {
      200: BatchTranslateResponseSchema,
      400: Error400Schema,
      401: Error401Schema,
      500: Error500Schema,
    },
  };

  const asyncBatchTranslateSchema = {
    tags: ['Translation'],
    summary: 'Asynchronous batch translation with signed webhook dispatch',
    description: `Submits an asynchronous batch translation. Results are dispatched upon completion to the provided \`webhookUrl\` with HMAC SHA-256 signatures (\`X-LinguaBridge-Signature\`).\n\n### Interactive cURL\n\`\`\`bash\n${CURL_TRANSLATE_ASYNC}\n\`\`\``,
    'x-codeSamples': [
      {
        lang: 'Shell',
        label: 'cURL',
        source: CURL_TRANSLATE_ASYNC,
      },
    ],
    headers: ApiKeyHeaderSchema,
    body: AsyncBatchTranslateRequestSchema,
    response: {
      202: AsyncBatchTranslateResponseSchema,
      400: Error400Schema,
      401: Error401Schema,
      500: Error500Schema,
    },
  };

  // Single translate handler
  const singleTranslateHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = TranslateBodyZodSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid translation request body',
        details: parseResult.error.issues,
      });
    }

    const payload = parseResult.data;
    const translationRequest: TranslationRequest = {
      ...payload,
      id: payload.id || uuidv4(),
    };

    try {
      const result = await opts.pipeline.process(translationRequest);

      // Financial Drift Alert Webhook Trigger:
      // If AST Financial Guard flagged the translation as 'unsafe', trigger webhook notification
      const hasDrift = result.status === 'unsafe' || (result.warnings || []).some((w) => w.includes('FINANCIAL_ENTITY_MISMATCH'));
      (request as any).auditMetadata = {
        sourceLang: result.sourceLang,
        targetLang: result.targetLang,
        protectedEntities: (result as any).extractedEntities || [],
        driftDetected: hasDrift,
      };

      if (result.status === 'unsafe') {
        const auditWebhookUrl =
          (request.headers['x-audit-webhook-url'] as string) ||
          process.env.FINANCIAL_AUDIT_WEBHOOK_URL;
        if (auditWebhookUrl) {
          webhookDispatcher
            .dispatchFinancialDrift(auditWebhookUrl, {
              translationId: result.id,
              sourceText: result.originalText,
              translatedText: result.translatedText,
              sourceLang: result.sourceLang,
              targetLang: result.targetLang,
              domain: translationRequest.domain,
              violations: result.warnings,
              detectedAt: new Date().toISOString(),
              tenantId: translationRequest.tenantId,
            })
            .catch((err) => request.log.error(err, 'Failed to dispatch financial drift webhook'));
        }
      }

      return reply.status(200).send(result);
    } catch (err) {
      request.log.error(err, 'Translation pipeline failed');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Translation pipeline encountered an unexpected error',
      });
    }
  };

  // Batch translate handler
  const batchTranslateHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const batchZodSchema = z.object({
      requests: z.array(TranslateBodyZodSchema).min(1).max(50),
    });

    const parseResult = batchZodSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid batch translation request body',
        details: parseResult.error.issues,
      });
    }

    const requests: TranslationRequest[] = parseResult.data.requests.map((r) => ({
      ...r,
      id: r.id || uuidv4(),
    }));

    try {
      const results = await opts.pipeline.processBatch(requests);
      return reply.status(200).send({ results });
    } catch (err) {
      request.log.error(err, 'Batch translation pipeline failed');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Batch translation pipeline encountered an unexpected error',
      });
    }
  };

  // Asynchronous batch translate handler
  const asyncBatchTranslateHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const asyncZodSchema = z.object({
      requests: z.array(TranslateBodyZodSchema).min(1).max(50),
      webhookUrl: z.string().url('webhookUrl must be a valid URL'),
      webhookSecret: z.string().optional(),
    });

    const parseResult = asyncZodSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid async batch translation request body',
        details: parseResult.error.issues,
      });
    }

    const { requests: rawRequests, webhookUrl, webhookSecret } = parseResult.data;
    const batchId = uuidv4();
    const requests: TranslationRequest[] = rawRequests.map((r) => ({
      ...r,
      id: r.id || uuidv4(),
    }));

    const startTime = Date.now();

    // Start background processing and respond 202 Accepted immediately
    setImmediate(async () => {
      try {
        const results = await opts.pipeline.processBatch(requests);
        const durationMs = Date.now() - startTime;
        const failedCount = results.filter((r) => r.status === 'failed' || r.status === 'unsafe').length;
        const successCount = results.length - failedCount;

        await webhookDispatcher.dispatchBatchCompleted(
          webhookUrl,
          {
            batchId,
            totalCount: results.length,
            successCount,
            failedCount,
            results,
            durationMs,
          },
          webhookSecret
        );
      } catch (err) {
        request.log.error(err, 'Async batch translation processing failed');
        await webhookDispatcher.dispatchBatchFailed(
          webhookUrl,
          {
            batchId,
            error: (err as Error).name || 'BATCH_PROCESSING_FAILED',
            message: (err as Error).message || 'Failed to process translation batch',
            totalCount: requests.length,
            failedRequests: requests,
          },
          webhookSecret
        );
      }
    });

    return reply.status(202).send({
      batchId,
      status: 'queued',
      totalCount: requests.length,
      webhookUrl,
      message: 'Asynchronous batch translation accepted and queued for processing',
    });
  };

  for (const prefix of ['/api/v1', '/v1']) {
    fastify.post(
      `${prefix}/translate`,
      { schema: singleTranslateSchema, preValidation: authPreValidation },
      singleTranslateHandler
    );
    fastify.post(
      `${prefix}/translate/batch`,
      { schema: batchTranslateSchema, preValidation: authPreValidation },
      batchTranslateHandler
    );
    fastify.post(
      `${prefix}/translate/async`,
      { schema: asyncBatchTranslateSchema, preValidation: authPreValidation },
      asyncBatchTranslateHandler
    );
  }
};
