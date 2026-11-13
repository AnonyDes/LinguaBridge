import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID as uuidv4 } from 'node:crypto';
import { z } from 'zod';
import type { TranslationPipeline } from '@linguabridge/translation-engine';
import type { TranslationRequest } from '@linguabridge/shared-types';
import type { ApiKeyService } from '../services/api-key-service';
import { authorize } from '../services/authorization';
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
  apiKeyService: ApiKeyService;
  webhookDestinations?: readonly string[];
  canTranslateTo: (target: string) => boolean;
}

const TranslateBodyZodSchema = z.object({
  id: z.string().optional(),
  sourceText: z.string().min(1, 'sourceText cannot be empty').max(12000),
  sourceLang: z.enum(['fr', 'en', 'auto']),
  targetLang: z.string().min(2).max(24),
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
  maxLatencyMs: z.number().int().positive().max(30000).optional(),
  privacyPolicy: z.enum(['no_external', 'allow_external']).optional(),
  glossaryVersion: z.string().optional(),
  packVersion: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const translateRoutes: FastifyPluginAsync<TranslateRouteOptions> = async (fastify, opts) => {
  const sandbox = () => process.env.NODE_ENV !== 'production' && process.env.REQUIRE_API_KEY !== 'true';
  const authRead = authorize(opts.apiKeyService, 'translate:read', sandbox);
  const authBatch = authorize(opts.apiKeyService, 'translate:batch', sandbox);
  const authWebhook = authorize(opts.apiKeyService, 'translate:webhook');
  const destinations = opts.webhookDestinations ??
    (process.env.WEBHOOK_DESTINATIONS ?? '').split(',').map((url) => url.trim()).filter(Boolean);
  let pendingBatches = 0;

  function toRequest(payload: z.infer<typeof TranslateBodyZodSchema>, request: FastifyRequest): TranslationRequest {
    return { ...payload, id: payload.id || uuidv4(), tenantId: request.apiKey?.tenantId ?? request.apiKey?.id };
  }

  function unsupportedTarget(reply: FastifyReply) {
    return reply.code(400).send({ error: 'Bad Request', message: 'The target language is unavailable' });
  }

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
    const rawBody = (request.body as any) || {};
    if (rawBody.text && !rawBody.sourceText) {
      rawBody.sourceText = rawBody.text;
    }
    if (!rawBody.sourceLang) {
      rawBody.sourceLang = 'fr';
    }
    const parseResult = TranslateBodyZodSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid translation request body',
        details: parseResult.error.issues,
      });
    }

    const payload = parseResult.data;
    if (!opts.canTranslateTo(payload.targetLang)) return unsupportedTarget(reply);
    const translationRequest = toRequest(payload, request);

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

      if (result.status === 'unsafe' && translationRequest.privacyPolicy === 'allow_external') {
        const auditWebhookUrl = process.env.FINANCIAL_AUDIT_WEBHOOK_URL;
        if (auditWebhookUrl?.startsWith('https://') && destinations.includes(auditWebhookUrl) && process.env.WEBHOOK_SECRET) {
          webhookDispatcher
            .dispatchFinancialDrift(auditWebhookUrl, {
              translationId: result.id,
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

    if (parseResult.data.requests.some((item) => !opts.canTranslateTo(item.targetLang))) return unsupportedTarget(reply);
    const requests = parseResult.data.requests.map((item) => toRequest(item, request));

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
    if (!webhookUrl.startsWith('https://') || !destinations.includes(webhookUrl) ||
      !(webhookSecret?.trim() || process.env.WEBHOOK_SECRET?.trim()) ||
      rawRequests.some((item) => item.privacyPolicy !== 'allow_external' || item.domain === 'financial' ||
        item.contentType === 'financial_confirmation' || item.contentType === 'financial_amount')) {
      return reply.code(400).send({ error: 'Bad Request', message: 'Webhook destination or request policy is unsupported' });
    }
    if (rawRequests.some((item) => !opts.canTranslateTo(item.targetLang))) return unsupportedTarget(reply);
    if (pendingBatches >= 8) {
      return reply.code(503).send({ error: 'Service Unavailable', message: 'Async translation queue is full' });
    }
    const batchId = uuidv4();
    const requests = rawRequests.map((item) => toRequest(item, request));

    const startTime = Date.now();

    // Start background processing and respond 202 Accepted immediately
    pendingBatches++;
    setImmediate(async () => {
      try {
        const results = await opts.pipeline.processBatch(requests);
        const durationMs = Date.now() - startTime;
        const successCount = results.filter((r) => ['success', 'memory_hit', 'fixture'].includes(r.status)).length;
        const failedCount = results.length - successCount;

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
          webhookSecret?.trim() || process.env.WEBHOOK_SECRET
        );
      } catch (err) {
        request.log.error(err, 'Async batch translation processing failed');
        await webhookDispatcher.dispatchBatchFailed(
          webhookUrl,
          {
            batchId,
            error: 'BATCH_PROCESSING_FAILED',
            message: 'Failed to process translation batch',
            totalCount: requests.length,
          },
          webhookSecret?.trim() || process.env.WEBHOOK_SECRET
        );
      } finally {
        pendingBatches--;
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

  const verifyHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = (request.body as any) || {};
    const sourceText = body.sourceText || body.text || '';
    const translatedText = body.translatedText || '';

    if (typeof sourceText !== 'string' || !sourceText || sourceText.length > 12000 ||
      typeof translatedText !== 'string' || !translatedText || translatedText.length > 12000) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'sourceText and translatedText are required',
      });
    }

    const { FinancialEntityExtractor, computeEntityFingerprint } = await import('@linguabridge/financial-domain');
    const extractor = new FinancialEntityExtractor();
    const srcEnts = extractor.extract(sourceText);
    const tgtEnts = extractor.extract(translatedText);
    const srcFp = computeEntityFingerprint(srcEnts);
    const tgtFp = computeEntityFingerprint(tgtEnts);
    const safe = srcFp === tgtFp;

    return reply.status(200).send({
      safe,
      sourceFingerprint: srcFp,
      translatedFingerprint: tgtFp,
      violations: safe ? [] : [{ type: 'drift', message: 'Entity fingerprint mismatch detected' }],
    });
  };

  for (const prefix of ['/api/v1', '/v1']) {
    fastify.post(
      `${prefix}/translate`,
      { schema: singleTranslateSchema, onRequest: authRead },
      singleTranslateHandler
    );
    fastify.post(
      `${prefix}/verify`,
      { onRequest: authRead },
      verifyHandler
    );
    fastify.post(
      `${prefix}/translate/batch`,
      { schema: batchTranslateSchema, onRequest: authBatch },
      batchTranslateHandler
    );
    fastify.post(
      `${prefix}/translate/async`,
      { schema: asyncBatchTranslateSchema, onRequest: authWebhook },
      asyncBatchTranslateHandler
    );
  }
};
