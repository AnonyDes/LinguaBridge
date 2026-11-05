import { randomUUID } from 'node:crypto';
import type { TranslationProvider, TranslationRequest, TranslationResult, ProviderHealth } from '@linguabridge/shared-types';
import { translateSentenceToEwondo, getEwondoPhonetic } from './ewondo-lexicon';
import { translateLocalText } from './duala-research';

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

  // 1. FR -> EWONDO (ewo-CM / ewo) — Certified NACALCO / Yaoundé I terms
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

  // 2. FR -> FULFULDE (fuv-CM / fuv) — Northern Cameroon & CEMAC
  'fr:fuv-CM:Solde': 'Keɓal',
  'fr:fuv-CM:Solde disponible': 'Ngalu heɓotoongu',
  'fr:fuv-CM:Solde disponible (compte principal)': 'Ngalu heɓotoongu (konta mawɗo)',
  'fr:fuv-CM:Virement': 'Neldugol ceede',
  'fr:fuv-CM:Transfert': 'Neldugol ceede',
  'fr:fuv-CM:Effectuer un transfert': 'Neldu ceede',
  'fr:fuv-CM:Effectuer un transfert d\'argent': 'Neldu ceede jaawɗum',
  'fr:fuv-CM:Confirmer': 'Tabintin',
  'fr:fuv-CM:Confirmer le transfert': 'Tabintin neldugol',
  'fr:fuv-CM:Annuler': 'Haaytinu',
  'fr:fuv-CM:Frais': 'Ceede golle',
  'fr:fuv-CM:Frais de transfert': 'Ceede neldugol',
  'fr:fuv-CM:Retrait': 'Ittugol ceede',
  'fr:fuv-CM:Dépôt': 'Watugol ceede',
  'fr:fuv-CM:Bénéficiaire': 'Keɓoowo',
  'fr:fuv-CM:Transaction': 'Golle ceede',
  'fr:fuv-CM:Historique des transactions': 'Tariika golle ceede',
  'fr:fuv-CM:Numéro de téléphone': 'Lamba telefoŋ',
  'fr:fuv-CM:Numéro du destinataire': 'Lamba keɓoowo',
  'fr:fuv-CM:Numéro du destinataire (Orange / MTN)': 'Lamba keɓoowo (Orange / MTN)',
  'fr:fuv-CM:Montant': 'Keɓal ceede',
  'fr:fuv-CM:Montant du transfert': 'Keɓal ceede neldeteeɗum',
  'fr:fuv-CM:Montant du transfert (FCFA)': 'Keɓal ceede (FCFA)',
  'fr:fuv-CM:Motif du paiement': 'Daliila yoɓol',
  'fr:fuv-CM:Paiement tontine mensuelle': 'Yoɓol dente lewru',
  'fr:fuv-CM:Transfert effectué avec succès ! Le reçu a été généré.': 'Ceede neldaama e jam ! Kereɗi heɓaama.',

  // 3. FR -> HAOUSSA (hau-CM / hau) — Northern Cameroon & CEMAC Corridors
  'fr:hau-CM:Solde': 'Ragowar kuɗi',
  'fr:hau-CM:Solde disponible': 'Kuɗin da za a iya amfani da su',
  'fr:hau-CM:Solde disponible (compte principal)': 'Kuɗin da za a iya amfani da su (babban asusu)',
  'fr:hau-CM:Virement': 'Tura kuɗi',
  'fr:hau-CM:Transfert': 'Tura kuɗi',
  'fr:hau-CM:Effectuer un transfert': 'Aika kuɗi',
  'fr:hau-CM:Effectuer un transfert d\'argent': 'Aika kuɗi cikin sauri',
  'fr:hau-CM:Confirmer': 'Tabbatar',
  'fr:hau-CM:Confirmer le transfert': 'Tabbatar da tura kuɗi',
  'fr:hau-CM:Annuler': 'Soke',
  'fr:hau-CM:Frais': 'Kuɗin sabis',
  'fr:hau-CM:Frais de transfert': 'Kuɗin aika kuɗi',
  'fr:hau-CM:Retrait': 'Cire kuɗi',
  'fr:hau-CM:Dépôt': 'Sanya kuɗi',
  'fr:hau-CM:Bénéficiaire': 'Mai karɓa',
  'fr:hau-CM:Transaction': 'Mu\'amalar kuɗi',
  'fr:hau-CM:Historique des transactions': 'Tarihin ma\'amaloli',
  'fr:hau-CM:Numéro de téléphone': 'Lambar waya',
  'fr:hau-CM:Numéro du destinataire': 'Lambar wayar mai karɓa',
  'fr:hau-CM:Numéro du destinataire (Orange / MTN)': 'Lambar mai karɓa (Orange / MTN)',
  'fr:hau-CM:Montant': 'Adadin kuɗi',
  'fr:hau-CM:Montant du transfert': 'Adadin kuɗin da za a aika',
  'fr:hau-CM:Montant du transfert (FCFA)': 'Adadin kuɗi (FCFA)',
  'fr:hau-CM:Motif du paiement': 'Dalilin biya',
  'fr:hau-CM:Paiement tontine mensuelle': 'Biyan adashe na wata',
  'fr:hau-CM:Transfert effectué avec succès ! Le reçu a été généré.': 'An aika kuɗi cikin nasara ! An samar da rasit.',

  // 4. FR -> KANURI (knc-CM / knc) — Far North & Lake Chad
  'fr:knc-CM:Solde': 'Liman kali',
  'fr:knc-CM:Solde disponible': 'Liman sawawa',
  'fr:knc-CM:Solde disponible (compte principal)': 'Liman sawawa (konta kura)',
  'fr:knc-CM:Virement': 'Kudi tewuro',
  'fr:knc-CM:Transfert': 'Kudi tewuro',
  'fr:knc-CM:Effectuer un transfert': 'Kudi tewuro diyiram',
  'fr:knc-CM:Effectuer un transfert d\'argent': 'Kudi tewuro diyiram lewuro',
  'fr:knc-CM:Confirmer': 'Gade taro',
  'fr:knc-CM:Confirmer le transfert': 'Tewuro gade taro',
  'fr:knc-CM:Annuler': 'Kola',
  'fr:knc-CM:Frais': 'Liman ladan',
  'fr:knc-CM:Frais de transfert': 'Kudi tewuro ladan',
  'fr:knc-CM:Retrait': 'Kudi roptiro',
  'fr:knc-CM:Dépôt': 'Kudi ciro',
  'fr:knc-CM:Bénéficiaire': 'Kudi ngowoma',
  'fr:knc-CM:Transaction': 'Kudi cidaram',
  'fr:knc-CM:Historique des transactions': 'Kudi cidaram gargam',
  'fr:knc-CM:Numéro de téléphone': 'Namba talaho',
  'fr:knc-CM:Numéro du destinataire': 'Namba ngowoma',
  'fr:knc-CM:Numéro du destinataire (Orange / MTN)': 'Namba ngowoma (Orange / MTN)',
  'fr:knc-CM:Montant': 'Kudi yanyi',
  'fr:knc-CM:Montant du transfert': 'Kudi tewuro yanyi',
  'fr:knc-CM:Montant du transfert (FCFA)': 'Kudi yanyi (FCFA)',
  'fr:knc-CM:Motif du paiement': 'Dali biya ro',
  'fr:knc-CM:Paiement tontine mensuelle': 'Kenta cida biya kambe',
  'fr:knc-CM:Transfert effectué avec succès ! Le reçu a été généré.': 'Kudi tewuro ngelawa lan cidono ! Risit goza.',

  // 5. FR -> CAMEROON PIDGIN ENGLISH (pcm-CM / pcm) — Urban markets, NW, SW, Littoral
  'fr:pcm-CM:Solde': 'Moni wey de',
  'fr:pcm-CM:Solde disponible': 'Moni wey yu fit yuz',
  'fr:pcm-CM:Solde disponible (compte principal)': 'Moni wey yu fit yuz (men akaunt)',
  'fr:pcm-CM:Virement': 'Send moni',
  'fr:pcm-CM:Transfert': 'Send moni',
  'fr:pcm-CM:Effectuer un transfert': 'Send moni nau',
  'fr:pcm-CM:Effectuer un transfert d\'argent': 'Send moni shap shap',
  'fr:pcm-CM:Confirmer': 'Kofam',
  'fr:pcm-CM:Confirmer le transfert': 'Kofam di transfer',
  'fr:pcm-CM:Annuler': 'Kansul',
  'fr:pcm-CM:Frais': 'Kach moni',
  'fr:pcm-CM:Frais de transfert': 'Transfer chach',
  'fr:pcm-CM:Retrait': 'Komot moni',
  'fr:pcm-CM:Dépôt': 'Put moni',
  'fr:pcm-CM:Bénéficiaire': 'Pesin wey de resiv moni',
  'fr:pcm-CM:Transaction': 'Pemen',
  'fr:pcm-CM:Historique des transactions': 'Old pemen dem',
  'fr:pcm-CM:Numéro de téléphone': 'Fon nomba',
  'fr:pcm-CM:Numéro du destinataire': 'Pesin fon nomba',
  'fr:pcm-CM:Numéro du destinataire (Orange / MTN)': 'Pesin fon nomba (Orange / MTN)',
  'fr:pcm-CM:Montant': 'Haumoch moni',
  'fr:pcm-CM:Montant du transfert': 'Moni wey yu wan send',
  'fr:pcm-CM:Montant du transfert (FCFA)': 'Haumoch moni (FCFA)',
  'fr:pcm-CM:Motif du paiement': 'Wetin dis moni na for',
  'fr:pcm-CM:Paiement tontine mensuelle': 'Njangi moni for dis mont',
  'fr:pcm-CM:Transfert effectué avec succès ! Le reçu a été généré.': 'Moni don go fain fain ! Resit don redi.',

  // EN -> 5 LANGUAGES
  'en:ewo-CM:Balance': 'Móni mí ne',
  'en:ewo-CM:Available balance': 'Móni mí ne wá é bẽng',
  'en:ewo-CM:Transfer': 'Lóm móni',
  'en:ewo-CM:Confirm': 'Tíbíli tóbó',
  'en:ewo-CM:Cancel': 'Dzágbá',
  'en:ewo-CM:Fees': 'Móni mébembá',
  'en:ewo-CM:Beneficiary': 'Nyí a nòng móni',

  'en:fuv-CM:Balance': 'Keɓal',
  'en:fuv-CM:Available balance': 'Ngalu heɓotoongu',
  'en:fuv-CM:Transfer': 'Neldugol ceede',
  'en:fuv-CM:Confirm': 'Tabintin',
  'en:fuv-CM:Cancel': 'Haaytinu',

  'en:hau-CM:Balance': 'Ragowar kuɗi',
  'en:hau-CM:Available balance': 'Kuɗin da za a iya amfani da su',
  'en:hau-CM:Transfer': 'Tura kuɗi',
  'en:hau-CM:Confirm': 'Tabbatar',
  'en:hau-CM:Cancel': 'Soke',

  'en:knc-CM:Balance': 'Liman kali',
  'en:knc-CM:Available balance': 'Liman sawawa',
  'en:knc-CM:Transfer': 'Kudi tewuro',
  'en:knc-CM:Confirm': 'Gade taro',
  'en:knc-CM:Cancel': 'Kola',

  'en:pcm-CM:Balance': 'Moni wey de',
  'en:pcm-CM:Available balance': 'Moni wey yu fit yuz',
  'en:pcm-CM:Transfer': 'Send moni',
  'en:pcm-CM:Confirm': 'Kofam',
  'en:pcm-CM:Cancel': 'Kansul',
};

// Mirror for short aliases (normalize ewo, fuv, hau, knc, pcm)
for (const [key, val] of Object.entries(FIXTURES)) {
  for (const code of ['ewo', 'fuv', 'hau', 'knc', 'pcm']) {
    if (key.includes(`${code}-CM`)) {
      FIXTURES[key.replace(`${code}-CM`, code)] = val;
    }
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

    const local = translateLocalText(request.sourceText, request.sourceLang, request.targetLang);
    const translatedText = found ?? local.translatedText;
    const isRecognized = !!found || (local.status === 'success');
    const isDuala = request.targetLang === 'dua' || request.targetLang === 'dua-CM';

    return Promise.resolve({
      id: request.id || randomUUID(),
      originalText: request.sourceText,
      translatedText,
      sourceLang: request.sourceLang,
      targetLang: request.targetLang,
      provider: this.id,
      status: isDuala ? 'unverified' : (isRecognized ? 'success' : 'unverified'),
      cacheStatus: 'miss',
      warnings: isDuala ? local.warnings : (isRecognized ? [] : local.warnings),
      latencyMs: 1,
      speechAvailable: true,
      phonetic: (request.targetLang === 'ewo-CM' || request.targetLang === 'ewo') ? getEwondoPhonetic(translatedText) : undefined,
    });
  }

  translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]> {
    return Promise.all(requests.map((r) => this.translate(r)));
  }

  healthCheck(): Promise<ProviderHealth> {
    return Promise.resolve({
      healthy: true,
      latencyMs: 0,
      message: 'Fixture & National Lexicon Provider operational (Ewondo, Fulfulde, Haoussa, Kanuri, Pidgin)',
      supportedPairs: [
        'fr→en', 'en→fr',
        'fr→ewo-CM', 'en→ewo-CM', 'fr→ewo', 'en→ewo',
        'fr→fuv-CM', 'en→fuv-CM', 'fr→fuv', 'en→fuv',
        'fr→hau-CM', 'en→hau-CM', 'fr→hau', 'en→hau',
        'fr→knc-CM', 'en→knc-CM', 'fr→knc', 'en→knc',
        'fr→pcm-CM', 'en→pcm-CM', 'fr→pcm', 'en→pcm',
      ],
    });
  }

  supports(sourceLang: string, targetLang: string): boolean {
    if (targetLang === 'dua-CM' || targetLang === 'dua') {
      // Duala is quarantined and hidden from visible operations
      return false;
    }
    const pair = `${sourceLang}→${targetLang}`;
    const validPairs = [
      'fr→en', 'en→fr',
      'fr→ewo-CM', 'en→ewo-CM', 'fr→ewo', 'en→ewo',
      'ewo-CM→fr', 'ewo-CM→en', 'ewo→fr', 'ewo→en',
      'fr→fuv-CM', 'en→fuv-CM', 'fr→fuv', 'en→fuv',
      'fr→hau-CM', 'en→hau-CM', 'fr→hau', 'en→hau',
      'fr→knc-CM', 'en→knc-CM', 'fr→knc', 'en→knc',
      'fr→pcm-CM', 'en→pcm-CM', 'fr→pcm', 'en→pcm',
    ];
    return validPairs.includes(pair);
  }
}
