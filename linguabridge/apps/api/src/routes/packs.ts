import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { LanguageRegistry } from '@linguabridge/language-registry';
import { LanguagePackStatusSchema } from '@linguabridge/language-registry';

export interface PacksRouteOptions {
  registry: LanguageRegistry;
}

const UpdateStatusSchema = z.object({
  status: LanguagePackStatusSchema,
});

export const packRoutes: FastifyPluginAsync<PacksRouteOptions> = async (fastify, opts) => {
  // GET /v1/packs — returns all language packs (administrative view)
  fastify.get('/v1/packs', async (_request, reply) => {
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
  });

  // GET /v1/packs/:id — returns a specific pack manifest
  fastify.get<{ Params: { id: string } }>('/v1/packs/:id', async (request, reply) => {
    const { id } = request.params;
    const pack = opts.registry.getPack(id);

    if (!pack) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Language pack '${id}' not found.`,
      });
    }

    return reply.status(200).send(pack);
  });

  // PATCH /v1/packs/:id/status — update pack status
  fastify.patch<{ Params: { id: string } }>('/v1/packs/:id/status', async (request, reply) => {
    const { id } = request.params;
    const parseResult = UpdateStatusSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid status update',
        details: parseResult.error.issues,
      });
    }

    const { status } = parseResult.data;

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
  });
};
