import { randomUUID } from 'crypto';
import type { TranslationProvider, TranslationRequest, TranslationResult, ProviderHealth } from '@linguabridge/shared-types';

const FIXTURES: Record<string, string> = {
  'fr:en:Bonjour': 'Hello',
  'fr:en:Solde': 'Balance',
  'fr:en:Virement': 'Transfer',
  'fr:en:Confirmer': 'Confirm',
  'fr:en:Annuler': 'Cancel',
  'fr:en:Frais': 'Fees',
  'fr:en:Retrait': 'Withdrawal',
  'fr:en:Dépôt': 'Deposit',
  'fr:en:Bénéficiaire': 'Beneficiary',
  'fr:en:Transaction': 'Transaction',
};

export class FixtureProvider implements TranslationProvider {
  id = 'fixture';
  name = 'Fixture Provider (Demo/Testing)';

  translate(request: TranslationRequest): Promise<TranslationResult> {
    const key = `${request.sourceLang}:${request.targetLang}:${request.sourceText}`;
    const found = FIXTURES[key];
    const translatedText = found ?? `[FIXTURE:${request.targetLang.toUpperCase()}] ${request.sourceText}`;

    return Promise.resolve({
      id: request.id || randomUUID(),
      originalText: request.sourceText,
      translatedText,
      sourceLang: request.sourceLang,
      targetLang: request.targetLang,
      provider: this.id,
      status: found ? 'success' : 'unverified',
      cacheStatus: 'miss',
      warnings: ['DEMO_FIXTURE_TRANSLATION — Not for production use'],
      latencyMs: 0,
      speechAvailable: false,
    });
  }

  translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]> {
    return Promise.all(requests.map((r) => this.translate(r)));
  }

  healthCheck(): Promise<ProviderHealth> {
    return Promise.resolve({ healthy: true, latencyMs: 0, message: 'Fixture provider always available' });
  }

  supports(sourceLang: string, targetLang: string): boolean {
    return (sourceLang === 'fr' && targetLang === 'en') ||
           (sourceLang === 'en' && targetLang === 'fr');
  }
}
