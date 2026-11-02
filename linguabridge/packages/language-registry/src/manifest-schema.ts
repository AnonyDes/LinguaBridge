import { z } from 'zod';

export const LanguagePackStatusSchema = z.enum([
  'not_installed',
  'installed_incomplete',
  'internal_testing',
  'under_review',
  'approved_limited',
  'production_approved',
  'deprecated',
  'disabled',
]);

export const LanguagePackCapabilitiesSchema = z.object({
  hasDictionary: z.boolean(),
  hasParallelCorpus: z.boolean(),
  hasSpeech: z.boolean(),
  hasPronunciation: z.boolean(),
  hasGlossary: z.boolean(),
});

export const ManifestValidator = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nativeName: z.string().optional(),
  iso639_3: z.string().min(2).max(4),
  locale: z.string().min(2),
  version: z.string().min(1),
  schemaVersion: z.string().min(1),
  status: LanguagePackStatusSchema,
  capabilities: LanguagePackCapabilitiesSchema,
  supportedSourceLangs: z.array(z.string()),
  supportedTargetLangs: z.array(z.string()),
  orthographicVariants: z.array(z.string()).optional(),
  license: z.string().min(1),
  provenance: z.string().min(1),
  attribution: z.string().optional(),
  qualityStatus: z.enum(['unverified', 'reviewed', 'certified']),
  reviewedBy: z.string().optional(),
  checksum: z.string().optional(),
  installationRequirements: z.array(z.string()).optional(),
  _note: z.string().optional(),
});

export type ManifestSchemaType = z.infer<typeof ManifestValidator>;
