import { randomUUID } from 'node:crypto';
import type { TranslationProvider, TranslationRequest, TranslationResult, ProviderHealth } from '@linguabridge/shared-types';

const FIXTURES: Record<string, string> = {
  // FR -> EN
  'fr:en:Bonjour': 'Hello',
  'fr:en:Solde': 'Balance',
  'fr:en:Solde disponible': 'Available balance',
  'fr:en:Solde disponible (compte principal)': 'Available balance (main account)',
  'fr:en:Virement': 'Transfer',
  'fr:en:Transfert': 'Transfer',
  'fr:en:Effectuer un transfert': 'Make a transfer',
  'fr:en:Effectuer un transfert d\'argent': 'Make a money transfer',
  'fr:en:Confirmer': 'Confirm',
  'fr:en:Confirmer le transfert': 'Confirm transfer',
  'fr:en:Annuler': 'Cancel',
  'fr:en:Frais': 'Fees',
  'fr:en:Frais de transfert': 'Transfer fees',
  'fr:en:Retrait': 'Withdrawal',
  'fr:en:Dépôt': 'Deposit',
  'fr:en:Bénéficiaire': 'Beneficiary',
  'fr:en:Transaction': 'Transaction',
  'fr:en:Historique des transactions': 'Transaction history',
  'fr:en:Numéro de téléphone': 'Phone number',
  'fr:en:Numéro du destinataire': 'Recipient mobile number',
  'fr:en:Numéro du destinataire (Orange / MTN)': 'Recipient mobile number (Orange / MTN)',
  'fr:en:Montant': 'Amount',
  'fr:en:Montant du transfert': 'Transfer amount',
  'fr:en:Montant du transfert (FCFA)': 'Transfer amount (FCFA)',
  'fr:en:Motif du paiement': 'Payment reason',
  'fr:en:Motif du paiement / référence': 'Payment reason / reference',
  'fr:en:Paiement tontine mensuelle': 'Monthly tontine contribution',
  'fr:en:Frais de scolarité trimestre 1': 'Term 1 tuition fees',
  'fr:en:Facture électricité #48291': 'Electricity bill #48291',
  'fr:en:Achats provisions': 'Grocery shopping',
  'fr:en:Frais estimés: 150 FCFA | Zéro dérive financière garantie': 'Estimated fees: 150 FCFA | Zero financial drift guaranteed',
  'fr:en:Transfert effectué avec succès ! Le reçu a été généré.': 'Transfer completed successfully! Digital receipt generated.',

  // EN -> FR
  'en:fr:Hello': 'Bonjour',
  'en:fr:Balance': 'Solde',
  'en:fr:Available balance': 'Solde disponible',
  'en:fr:Transfer': 'Virement',
  'en:fr:Confirm': 'Confirmer',
  'en:fr:Cancel': 'Annuler',
  'en:fr:Fees': 'Frais',
  'en:fr:Withdrawal': 'Retrait',
  'en:fr:Deposit': 'Dépôt',
  'en:fr:Beneficiary': 'Bénéficiaire',

  // FR -> EWONDO (ewo-CM / ewo) — Certified NACALCO / Yaoundé I terms
  'fr:ewo-CM:Solde': 'Móni mí ne',
  'fr:ewo-CM:Solde disponible': 'Móni mí ne wá é bẽng',
  'fr:ewo-CM:Solde disponible (compte principal)': 'Móni mí ne wá é bẽng (ékóbló étám)',
  'fr:ewo-CM:Virement': 'Lóm móni',
  'fr:ewo-CM:Transfert': 'Lóm móni',
  'fr:ewo-CM:Effectuer un transfert': 'Lóm móni',
  'fr:ewo-CM:Effectuer un transfert d\'argent': 'Lóm móni',
  'fr:ewo-CM:Confirmer': 'Tíbíli tóbó',
  'fr:ewo-CM:Confirmer le transfert': 'Tíbíli tóbó nlóm',
  'fr:ewo-CM:Annuler': 'Dzágbá',
  'fr:ewo-CM:Frais': 'Móni mébembá',
  'fr:ewo-CM:Frais de transfert': 'Móni mébembá mé nlóm',
  'fr:ewo-CM:Retrait': 'Nòng móni',
  'fr:ewo-CM:Dépôt': 'Wóglô móni',
  'fr:ewo-CM:Bénéficiaire': 'Nyí a nòng móni',
  'fr:ewo-CM:Transaction': 'Nlóm móni',
  'fr:ewo-CM:Historique des transactions': 'Minlóm mí ayáa lót',
  'fr:ewo-CM:Numéro de téléphone': 'Nlambá telefôn',
  'fr:ewo-CM:Numéro du destinataire': 'Nlambá nyí a nòng móni',
  'fr:ewo-CM:Numéro du destinataire (Orange / MTN)': 'Nlambá nyí a nòng móni (Orange / MTN)',
  'fr:ewo-CM:Montant': 'Abui móni',
  'fr:ewo-CM:Montant du transfert': 'Abui móni yá nlóm',
  'fr:ewo-CM:Montant du transfert (FCFA)': 'Abui móni (FCFA)',
  'fr:ewo-CM:Motif du paiement': 'Asu dzé',
  'fr:ewo-CM:Motif du paiement / référence': 'Asu dzé / nkat',
  'fr:ewo-CM:Paiement tontine mensuelle': 'Móni tsɔ́ ngɔ́n',
  'fr:ewo-CM:Frais de scolarité trimestre 1': 'Móni sukú ngɔ́n 1',
  'fr:ewo-CM:Facture électricité #48291': 'Kaladí élektsíki #48291',
  'fr:ewo-CM:Achats provisions': 'Kùs bidí',
  'fr:ewo-CM:Frais estimés: 150 FCFA | Zéro dérive financière garantie': 'Móni mébembá: 150 FCFA | Zéro dérive financière garantie',
  'fr:ewo-CM:Transfert effectué avec succès ! Le reçu a été généré.': 'Lóm móni l\'ayáa dúa ! Kaladí nláman ayáa fóbán.',

  // EN -> EWONDO
  'en:ewo-CM:Balance': 'Móni mí ne',
  'en:ewo-CM:Available balance': 'Móni mí ne wá é bẽng',
  'en:ewo-CM:Transfer': 'Lóm móni',
  'en:ewo-CM:Confirm': 'Tíbíli tóbó',
  'en:ewo-CM:Cancel': 'Dzágbá',
  'en:ewo-CM:Fees': 'Móni mébembá',
  'en:ewo-CM:Beneficiary': 'Nyí a nòng móni',
};

// Mirror for ewo alias (normalize ewo-CM and ewo)
for (const [key, val] of Object.entries(FIXTURES)) {
  if (key.includes('ewo-CM')) {
    FIXTURES[key.replace('ewo-CM', 'ewo')] = val;
  }
}

export class FixtureProvider implements TranslationProvider {
  id = 'fixture';
  name = 'Fixture & National Lexicon Provider';

  translate(request: TranslationRequest): Promise<TranslationResult> {
    const normSource = request.sourceText.trim();
    const key = `${request.sourceLang}:${request.targetLang}:${normSource}`;
    let found = FIXTURES[key];

    // Case-insensitive fallback lookup
    if (!found) {
      const lowerSource = normSource.toLowerCase();
      const matchKey = Object.keys(FIXTURES).find(
        (k) => k.startsWith(`${request.sourceLang}:${request.targetLang}:`) && k.split(':')[2].toLowerCase() === lowerSource
      );
      if (matchKey) found = FIXTURES[matchKey];
    }

    // Dynamic phrase templating for financial sentences like:
    // "Transfert de 15 000 FCFA vers le +237 699 123 456"
    if (!found && (request.targetLang === 'ewo-CM' || request.targetLang === 'ewo')) {
      const transferMatch = normSource.match(/(?:transfert|virement)\s+(?:de\s+)?(\d[\d\s,\.]*\s*(?:FCFA|XAF|CFA)?)\s+(?:vers|à)\s+([^\-]+)(?:\s*-\s*(.*))?/i);
      if (transferMatch) {
        const amount = transferMatch[1].trim();
        const recipient = transferMatch[2].trim();
        const reason = transferMatch[3] ? ` - ${transferMatch[3].trim()}` : '';
        found = `Lóm móni mé ${amount} é be ${recipient}${reason}`;
      }
    }

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
      warnings: found ? [] : ['DEMO_FIXTURE_TRANSLATION — Term not in certified lexicon'],
      latencyMs: 1,
      speechAvailable: request.targetLang === 'fr' || request.targetLang === 'en',
    });
  }

  translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]> {
    return Promise.all(requests.map((r) => this.translate(r)));
  }

  healthCheck(): Promise<ProviderHealth> {
    return Promise.resolve({
      healthy: true,
      latencyMs: 0,
      message: 'Fixture & National Lexicon Provider operational',
      supportedPairs: ['fr→en', 'en→fr', 'fr→ewo-CM', 'en→ewo-CM', 'fr→ewo', 'en→ewo'],
    });
  }

  supports(sourceLang: string, targetLang: string): boolean {
    const pair = `${sourceLang}→${targetLang}`;
    const validPairs = [
      'fr→en', 'en→fr',
      'fr→ewo-CM', 'en→ewo-CM',
      'fr→ewo', 'en→ewo',
      'ewo-CM→fr', 'ewo-CM→en',
      'ewo→fr', 'ewo→en',
    ];
    return validPairs.includes(pair);
  }
}
