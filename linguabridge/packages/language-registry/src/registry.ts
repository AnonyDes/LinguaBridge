import type { LanguagePackManifest, Language, LanguagePackStatus } from '@linguabridge/shared-types';
import { ManifestValidator } from './manifest-schema';

export class LanguageRegistry {
  private packs: Map<string, LanguagePackManifest> = new Map();

  async loadManifest(manifest: LanguagePackManifest): Promise<{ valid: boolean; errors?: string[] }> {
    const validation = ManifestValidator.safeParse(manifest);
    if (!validation.success) {
      return { valid: false, errors: validation.error.issues.map((i) => i.message) };
    }
    this.packs.set(manifest.id, manifest);
    return { valid: true };
  }

  getAvailableLanguages(): Language[] {
    // CRITICAL: Only return production_approved packs
    return Array.from(this.packs.values())
      .filter((pack) => pack.status === 'production_approved')
      .map((pack) => ({
        code: pack.locale,
        name: pack.name,
        nativeName: pack.nativeName,
        iso639_3: pack.iso639_3,
        speechAvailable: pack.capabilities.hasSpeech,
        packStatus: pack.status,
        isAvailable: true,
      }));
  }

  getAllLanguagesForAdmin(): Array<Language & { manifest: LanguagePackManifest }> {
    return Array.from(this.packs.values()).map((pack) => ({
      code: pack.locale,
      name: pack.name,
      nativeName: pack.nativeName,
      iso639_3: pack.iso639_3,
      speechAvailable: pack.capabilities.hasSpeech,
      packStatus: pack.status,
      isAvailable: pack.status === 'production_approved',
      manifest: pack,
    }));
  }

  getPack(packId: string): LanguagePackManifest | undefined {
    return this.packs.get(packId);
  }

  canTranslateTo(targetLang: string): boolean {
    return Array.from(this.packs.values()).some(
      (pack) =>
        pack.status === 'production_approved' &&
        (pack.supportedTargetLangs.includes(targetLang) || pack.locale === targetLang)
    );
  }

  updatePackStatus(packId: string, status: LanguagePackStatus): boolean {
    const pack = this.packs.get(packId);
    if (!pack) return false;

    // Safety: only certified packs with verified linguistic capabilities can be production approved
    if (status === 'production_approved') {
      const hasResources = pack.capabilities.hasGlossary || pack.capabilities.hasDictionary;
      const isCertified = pack.qualityStatus === 'certified' || pack.qualityStatus === 'reviewed';

      if (!hasResources || !isCertified) {
        throw new Error(
          `Pack "${packId}" cannot be activated: Cameroonian language resources not yet verified. ` +
          'A certified lexicon and qualified linguist review are required before activation.'
        );
      }
    }

    pack.status = status;
    return true;
  }
}
