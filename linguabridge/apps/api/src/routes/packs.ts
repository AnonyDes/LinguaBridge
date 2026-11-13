import type { FastifyPluginAsync } from 'fastify';
import type { LanguageRegistry } from '@linguabridge/language-registry';
import { LanguagePackStatusSchema } from '@linguabridge/language-registry';
import {
  PacksListResponseSchema,
  FullPackManifestSchema,
  UpdatePackStatusBodySchema,
  UpdatePackStatusResponseSchema,
  Error400Schema,
  Error404Schema,
  Error422Schema,
  Error500Schema,
  CURL_GET_PACKS,
  CURL_GET_PACK_DETAIL,
  CURL_PATCH_PACK_STATUS,
} from '../schemas/openapi-schemas';

export interface PacksRouteOptions {
  registry: LanguageRegistry;
}

export const packRoutes: FastifyPluginAsync<PacksRouteOptions> = async (fastify, opts) => {
  const getPacksSchema = {
    tags: ['Packs'],
    summary: 'List all installed language packs (administrative view)',
    description: `Administrative inventory of all registered language packs, including certified production packs and quarantined templates awaiting linguistic review.\n\n### Interactive cURL\n\`\`\`bash\n${CURL_GET_PACKS}\n\`\`\``,
    'x-codeSamples': [
      {
        lang: 'Shell',
        label: 'cURL',
        source: CURL_GET_PACKS,
      },
    ],
    response: {
      200: PacksListResponseSchema,
      500: Error500Schema,
    },
  };

  const getPackDetailSchema = {
    tags: ['Packs'],
    summary: 'Get language pack manifest by pack ID',
    description: `Retrieves complete language pack manifest, including provenance, license, orthographic variants, and capability matrix.\n\n### Interactive cURL\n\`\`\`bash\n${CURL_GET_PACK_DETAIL}\n\`\`\``,
    'x-codeSamples': [
      {
        lang: 'Shell',
        label: 'cURL',
        source: CURL_GET_PACK_DETAIL,
      },
    ],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier of the language pack (e.g. ewondo, en-fr, duala)',
          example: 'ewondo',
        },
      },
    },
    response: {
      200: FullPackManifestSchema,
      404: Error404Schema,
      500: Error500Schema,
    },
  };

  const patchPackStatusSchema = {
    tags: ['Packs'],
    summary: 'Update language pack lifecycle status',
    description: `Updates language pack lifecycle state (e.g. under_review, disabled). Rejects unauthorized activation of uncertified Cameroonian packs with HTTP 422.\n\n### Interactive cURL\n\`\`\`bash\n${CURL_PATCH_PACK_STATUS}\n\`\`\``,
    'x-codeSamples': [
      {
        lang: 'Shell',
        label: 'cURL',
        source: CURL_PATCH_PACK_STATUS,
      },
    ],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier of the language pack to update',
          example: 'duala',
        },
      },
    },
    body: UpdatePackStatusBodySchema,
    response: {
      200: UpdatePackStatusResponseSchema,
      400: Error400Schema,
      404: Error404Schema,
      422: Error422Schema,
      500: Error500Schema,
    },
  };

  const getPacksHandler = async (_request: any, reply: any) => {
    const all = opts.registry.getAllLanguagesForAdmin();
    const packs = all.map((l) => ({
      packId: l.manifest.id,
      code: l.manifest.locale,
      name: l.manifest.name,
      nativeName: l.manifest.nativeName,
      iso639_3: l.manifest.iso639_3,
      locale: l.manifest.locale,
      version: l.manifest.version,
      status: l.manifest.status,
      isAvailable: l.isAvailable,
      capabilities: l.manifest.capabilities,
      qualityStatus: l.manifest.qualityStatus,
      provenance: l.manifest.provenance,
    }));
    return reply.status(200).send({
      packs,
      count: packs.length,
    });
  };

  const getPackDetailHandler = async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const pack = opts.registry.getPack(id);

    if (!pack) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Language pack '${id}' not found.`,
      });
    }

    return reply.status(200).send(pack);
  };

  const patchPackStatusHandler = async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const parseResult = LanguagePackStatusSchema.safeParse(request.body?.status);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid status update',
        details: parseResult.error.issues,
      });
    }

    const status = parseResult.data;

    try {
      const updated = opts.registry.updatePackStatus(id, status);
      if (!updated) {
        return reply.status(404).send({
          error: 'Not Found',
          message: `Language pack '${id}' not found.`,
        });
      }

      return reply.status(200).send({
        id,
        status,
        updated: true,
      });
    } catch (err) {
      return reply.status(422).send({
        error: 'Unprocessable Entity',
        message: (err as Error).message,
      });
    }
  };

  for (const prefix of ['/api/v1', '/v1']) {
    fastify.get(`${prefix}/packs`, { schema: getPacksSchema }, getPacksHandler);
    fastify.get(`${prefix}/packs/:id`, { schema: getPackDetailSchema }, getPackDetailHandler);
    fastify.patch(`${prefix}/packs/:id/status`, { schema: patchPackStatusSchema }, patchPackStatusHandler);
  }
};
