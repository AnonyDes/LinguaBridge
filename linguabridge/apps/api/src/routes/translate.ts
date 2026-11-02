import type { FastifyPluginAsync } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import type { TranslationPipeline } from '@linguabridge/translation-engine';
import type { TranslationRequest } from '@linguabridge/shared-types';

export interface TranslateRouteOptions {
  pipeline: TranslationPipeline;
}

const TranslateBodySchema = z.object({
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
  fastify.post('/v1/translate', async (request, reply) => {
    const parseResult = TranslateBodySchema.safeParse(request.body);
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
      return reply.status(200).send(result);
    } catch (err) {
      request.log.error(err, 'Translation pipeline failed');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Translation pipeline encountered an unexpected error',
      });
    }
  });

  fastify.post('/v1/translate/batch', async (request, reply) => {
    const batchSchema = z.object({
      requests: z.array(TranslateBodySchema).min(1).max(50),
    });

    const parseResult = batchSchema.safeParse(request.body);
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
  });
};
