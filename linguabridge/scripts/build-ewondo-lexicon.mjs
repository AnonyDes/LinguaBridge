import fs from 'node:fs';
import path from 'node:path';

const apertiumData = JSON.parse(
  fs.readFileSync('language-packs/ewondo/dictionaries/apertium-lexicon.json', 'utf8')
);
const glossaryData = JSON.parse(
  fs.readFileSync('language-packs/ewondo/dictionaries/financial-glossary.json', 'utf8')
);

const outPath = path.resolve('packages/translation-engine/src/providers/ewondo-lexicon.ts');

const code = `// AUTO-GENERATED & CURATED EWONDO BILINGUAL LEXICON
// Source: Apertium (Dr. Emmanuel Ngue-Um) + NACALCO / Université de Yaoundé I

export interface LexiconEntry {
  ewo: string;
  fra: string;
  en?: string;
  phonetic?: string;
  pos?: string;
  par?: string;
}

export const APERTIUM_EWONDO_ENTRIES: LexiconEntry[] = ${JSON.stringify(apertiumData.entries, null, 2)};

export const FINANCIAL_GLOSSARY_ENTRIES: LexiconEntry[] = ${JSON.stringify(
  glossaryData.terms.map((t) => ({
    ewo: t.ewo,
    fra: t.fr,
    en: t.en,
    phonetic: t.phonetic,
  })),
  null,
  2
)};

// Extended banking, fintech & web UI lexicon
export const EXTENDED_BANKING_UI_LEXICON: Record<string, { ewo: string; phonetic?: string }> = {
  // Navigation & Space
  'bienvenue': { ewo: 'Mbólo', phonetic: 'm-bó-lo' },
  'bienvenue sur votre espace bancaire': { ewo: 'Mbólo é mvôk nda móni wên', phonetic: 'm-bó-lo é m-vôk n-da mó-ní wên' },
  'bienvenue sur votre espace client': { ewo: 'Mbólo é mvôk émòt wên', phonetic: 'm-bó-lo é m-vôk é-mòt wên' },
  'bienvenue sur': { ewo: 'Mbólo é', phonetic: 'm-bó-lo é' },
  'espace bancaire': { ewo: 'Mvôk nda móni', phonetic: 'm-vôk n-da mó-ní' },
  'espace client': { ewo: 'Mvôk émòt', phonetic: 'm-vôk é-mòt' },
  'mon espace': { ewo: 'Mvôk dama', phonetic: 'm-vôk da-ma' },
  'votre espace': { ewo: 'Mvôk wên', phonetic: 'm-vôk wên' },
  'espace': { ewo: 'Mvôk', phonetic: 'm-vôk' },
  'accueil': { ewo: 'Mvôk', phonetic: 'm-vôk' },
  'page d accueil': { ewo: 'Mvôk kaladí', phonetic: 'm-vôk kà-là-dí' },
  'page d\\'accueil': { ewo: 'Mvôk kaladí', phonetic: 'm-vôk kà-là-dí' },
  'menu': { ewo: 'Mimbònán', phonetic: 'mìm-bò-nán' },
  'paramètres': { ewo: 'Mimbònán', phonetic: 'mìm-bò-nán' },
  'parametres': { ewo: 'Mimbònán', phonetic: 'mìm-bò-nán' },
  'profil': { ewo: 'Émòt', phonetic: 'é-mòt' },
  'client': { ewo: 'Môt', phonetic: 'môt' },
  'clients': { ewo: 'Bôt', phonetic: 'bôt' },
  'utilisateur': { ewo: 'Môt', phonetic: 'môt' },
  'utilisateurs': { ewo: 'Bôt', phonetic: 'bôt' },
  'tableau de bord': { ewo: 'Mvôk mimbònán', phonetic: 'm-vôk mìm-bò-nán' },

  // Banking Institutions & Points of Service
  'banque': { ewo: 'Nda móni', phonetic: 'n-da mó-ní' },
  'banques': { ewo: 'Menda mé móni', phonetic: 'men-da mé mó-ní' },
  'agence': { ewo: 'Tò nda móni', phonetic: 'tò n-da mó-ní' },
  'agences': { ewo: 'Mètò nda móni', phonetic: 'mè-tò n-da mó-ní' },
  'guichet': { ewo: 'Wóglô móni', phonetic: 'wó-gló mó-ní' },
  'guichets': { ewo: 'Mewóglô móni', phonetic: 'me-wó-gló mó-ní' },
  'distributeur': { ewo: 'Masín móni', phonetic: 'ma-sín mó-ní' },
  'distributeurs': { ewo: 'Masín móni', phonetic: 'ma-sín mó-ní' },
  'distributeur automatique': { ewo: 'Masín móni', phonetic: 'ma-sín mó-ní' },
  'dab': { ewo: 'Masín móni', phonetic: 'ma-sín mó-ní' },

  // Accounts
  'compte': { ewo: 'Ékóbló', phonetic: 'é-kó-bló' },
  'comptes': { ewo: 'Makóbló', phonetic: 'ma-kó-bló' },
  'mon compte': { ewo: 'Ékóbló dama', phonetic: 'é-kó-bló da-ma' },
  'mes comptes': { ewo: 'Makóbló mama', phonetic: 'ma-kó-bló ma-ma' },
  'votre compte': { ewo: 'Ékóbló wên', phonetic: 'é-kó-bló wên' },
  'vos comptes': { ewo: 'Makóbló mên', phonetic: 'ma-kó-bló mên' },
  'compte bancaire': { ewo: 'Ékóbló móni', phonetic: 'é-kó-bló mó-ní' },
  'compte courant': { ewo: 'Ékóbló étám', phonetic: 'é-kó-bló é-tám' },
  'compte epargne': { ewo: 'Ékóbló bóm móni', phonetic: 'é-kó-bló bóm mó-ní' },
  'compte épargne': { ewo: 'Ékóbló bóm móni', phonetic: 'é-kó-bló bóm mó-ní' },
  'compte d\\'épargne': { ewo: 'Ékóbló bóm móni', phonetic: 'é-kó-bló bóm mó-ní' },
  'compte d epargne': { ewo: 'Ékóbló bóm móni', phonetic: 'é-kó-bló bóm mó-ní' },
  'numéro de compte': { ewo: 'Nlambá ékóbló', phonetic: 'n-làm-bá é-kó-bló' },
  'relevé de compte': { ewo: 'Kaladí ékóbló', phonetic: 'kà-là-dí é-kó-bló' },
  'releve de compte': { ewo: 'Kaladí ékóbló', phonetic: 'kà-là-dí é-kó-bló' },
  'relevé': { ewo: 'Kaladí ékóbló', phonetic: 'kà-là-dí é-kó-bló' },
  'releve': { ewo: 'Kaladí ékóbló', phonetic: 'kà-là-dí é-kó-bló' },
  'rib': { ewo: 'Nlambá ékóbló', phonetic: 'n-làm-bá é-kó-bló' },
  'iban': { ewo: 'Nlambá ékóbló', phonetic: 'n-làm-bá é-kó-bló' },

  // Balances & Currency
  'solde': { ewo: 'Móni mí ne', phonetic: 'mó-ní mí né' },
  'balance': { ewo: 'Móni mí ne', phonetic: 'mó-ní mí né' },
  'solde disponible': { ewo: 'Móni mí ne wá é bẽng', phonetic: 'mó-ní mí né wá é bèŋ' },
  'solde actuel': { ewo: 'Móni mí ne náná', phonetic: 'mó-ní mí né ná-ná' },
  'mon solde': { ewo: 'Móni mí ne', phonetic: 'mó-ní mí né' },
  'votre solde': { ewo: 'Móni mí ne wên', phonetic: 'mó-ní mí né wên' },
  'consulter mon solde': { ewo: 'Yên móni mí ne', phonetic: 'yên mó-ní mí né' },
  'consulter mon compte': { ewo: 'Yên ékóbló dama', phonetic: 'yên é-kó-bló da-ma' },
  'consulter le solde': { ewo: 'Yên móni mí ne', phonetic: 'yên mó-ní mí né' },
  'consulter le solde disponible': { ewo: 'Yên móni mí ne wá é bẽng', phonetic: 'yên mó-ní mí né wá é bèŋ' },
  'consulter': { ewo: 'Yên', phonetic: 'yên' },
  'montant': { ewo: 'Abui móni', phonetic: 'à-bùì mó-ní' },
  'montant du transfert': { ewo: 'Abui móni yá nlóm', phonetic: 'à-bùì mó-ní yá n-lóm' },
  'montant total': { ewo: 'Abui móni mésë', phonetic: 'à-bùì mó-ní mé-së' },
  'argent': { ewo: 'Móni', phonetic: 'mó-ní' },
  'l\\'argent': { ewo: 'Móni', phonetic: 'mó-ní' },
  'd\\'argent': { ewo: 'móni', phonetic: 'mó-ní' },
  'votre argent': { ewo: 'Móni wên', phonetic: 'mó-ní wên' },
  'mon argent': { ewo: 'Móni wama', phonetic: 'mó-ní wa-ma' },
  'votre argent est en sécurité': { ewo: 'Móni wên é ne mbaán', phonetic: 'mó-ní wên é né m-ba-án' },

  // Transfers & Operations
  'virement': { ewo: 'Lóm móni', phonetic: 'lóm mó-ní' },
  'virements': { ewo: 'Minlóm mí móni', phonetic: 'mì-n-lóm mí mó-ní' },
  'transfert': { ewo: 'Lóm móni', phonetic: 'lóm mó-ní' },
  'transferts': { ewo: 'Minlóm mí móni', phonetic: 'mì-n-lóm mí mó-ní' },
  'virement bancaire': { ewo: 'Lóm móni', phonetic: 'lóm mó-ní' },
  'transfert d\\'argent': { ewo: 'Lóm móni', phonetic: 'lóm mó-ní' },
  'effectuer un virement': { ewo: 'Lóm móni', phonetic: 'lóm mó-ní' },
  'effectuer un transfert': { ewo: 'Lóm móni', phonetic: 'lóm mó-ní' },
  'effectuer un virement sécurisé': { ewo: 'Lóm móni é ne mbaán', phonetic: 'lóm mó-ní é né m-ba-án' },
  'envoyer de l\\'argent': { ewo: 'Lóm móni', phonetic: 'lóm mó-ní' },
  'envoyer de l argent': { ewo: 'Lóm móni', phonetic: 'lóm mó-ní' },
  'envoyer': { ewo: 'Lóm', phonetic: 'lóm' },
  'recevoir de l\\'argent': { ewo: 'Nòng móni', phonetic: 'nòŋ mó-ní' },
  'recevoir de l argent': { ewo: 'Nòng móni', phonetic: 'nòŋ mó-ní' },
  'recevoir': { ewo: 'Nòng', phonetic: 'nòŋ' },
  'retrait': { ewo: 'Nòng móni', phonetic: 'nòŋ mó-ní' },
  'retraits': { ewo: 'Minlòng mí móni', phonetic: 'mì-n-lòŋ mí mó-ní' },
  'retrait d\\'argent': { ewo: 'Nòng móni', phonetic: 'nòŋ mó-ní' },
  'retrait au distributeur': { ewo: 'Nòng móni é masín', phonetic: 'nòŋ mó-ní é ma-sín' },
  'dépôt': { ewo: 'Wóglô móni', phonetic: 'wó-gló mó-ní' },
  'depot': { ewo: 'Wóglô móni', phonetic: 'wó-gló mó-ní' },
  'dépôts': { ewo: 'Mewóglô móni', phonetic: 'me-wó-gló mó-ní' },
  'depots': { ewo: 'Mewóglô móni', phonetic: 'me-wó-gló mó-ní' },
  'dépôt d\\'argent': { ewo: 'Wóglô móni', phonetic: 'wó-gló mó-ní' },
  'payer': { ewo: 'Kùs', phonetic: 'kùs' },
  'paiement': { ewo: 'Tóbó móni', phonetic: 'tó-bó mó-ní' },
  'paiements': { ewo: 'Matóbó móni', phonetic: 'ma-tó-bó mó-ní' },
  'paiement de facture': { ewo: 'Tóbó móni yá kaladí', phonetic: 'tó-bó mó-ní yá kà-là-dí' },
  'paiement sécurisé': { ewo: 'Tóbó móni é ne mbaán', phonetic: 'tó-bó mó-ní é né m-ba-án' },
  'facture': { ewo: 'Kaladí móni', phonetic: 'kà-là-dí mó-ní' },
  'factures': { ewo: 'Mekaladí mé móni', phonetic: 'me-kà-là-dí mé mó-ní' },
  'reçu': { ewo: 'Kaladí nláman', phonetic: 'kà-là-dí n-lá-màn' },
  'recu': { ewo: 'Kaladí nláman', phonetic: 'kà-là-dí n-lá-màn' },
  'reçus': { ewo: 'Mekaladí nláman', phonetic: 'me-kà-là-dí n-lá-màn' },
  'recus': { ewo: 'Mekaladí nláman', phonetic: 'me-kà-là-dí n-lá-màn' },
  'télécharger mon reçu': { ewo: 'Nòng kaladí nláman', phonetic: 'nòŋ kà-là-dí n-lá-màn' },
  'télécharger le reçu': { ewo: 'Nòng kaladí nláman', phonetic: 'nòŋ kà-là-dí n-lá-màn' },
  'télécharger': { ewo: 'Nòng kaladí', phonetic: 'nòŋ kà-là-dí' },
  'telecharger': { ewo: 'Nòng kaladí', phonetic: 'nòŋ kà-là-dí' },

  // Fees & Economics
  'frais': { ewo: 'Móni mébembá', phonetic: 'mó-ní mé-bèm-bá' },
  'frais de transfert': { ewo: 'Móni mébembá mé nlóm', phonetic: 'mó-ní mé-bèm-bá mé n-lóm' },
  'frais de tenue de compte': { ewo: 'Móni mébembá mé ékóbló', phonetic: 'mó-ní mé-bèm-bá mé é-kó-bló' },
  'frais de retrait': { ewo: 'Móni mébembá mé nnòng', phonetic: 'mó-ní mé-bèm-bá mé n-nòŋ' },
  'sans frais': { ewo: 'Tégé móni mébembá', phonetic: 'té-gé mó-ní mé-bèm-bá' },
  'gratuit': { ewo: 'Tégé móni mébembá', phonetic: 'té-gé mó-ní mé-bèm-bá' },
  'taux': { ewo: 'Abui', phonetic: 'à-bùì' },
  'taux d\\'intérêt': { ewo: 'Abui móni mébembá', phonetic: 'à-bùì mó-ní mé-bèm-bá' },
  'taux d interet': { ewo: 'Abui móni mébembá', phonetic: 'à-bùì mó-ní mé-bèm-bá' },
  'crédit': { ewo: 'Kálá móni', phonetic: 'ká-lá mó-ní' },
  'credit': { ewo: 'Kálá móni', phonetic: 'ká-lá mó-ní' },
  'crédits': { ewo: 'Kálá móni', phonetic: 'ká-lá mó-ní' },
  'credits': { ewo: 'Kálá móni', phonetic: 'ká-lá mó-ní' },
  'prêt': { ewo: 'Kálá móni', phonetic: 'ká-lá mó-ní' },
  'pret': { ewo: 'Kálá móni', phonetic: 'ká-lá mó-ní' },
  'prêts': { ewo: 'Kálá móni', phonetic: 'ká-lá mó-ní' },
  'prets': { ewo: 'Kálá móni', phonetic: 'ká-lá mó-ní' },
  'épargne': { ewo: 'Bóm móni', phonetic: 'bóm mó-ní' },
  'epargne': { ewo: 'Bóm móni', phonetic: 'bóm mó-ní' },
  'tontine': { ewo: 'Móni tsɔ́', phonetic: 'mó-ní tsɔ́' },
  'cotisation': { ewo: 'Móni tsɔ́', phonetic: 'mó-ní tsɔ́' },

  // Parties & Roles
  'bénéficiaire': { ewo: 'Nyí a nòng móni', phonetic: 'nyí à nòŋ mó-ní' },
  'beneficiaire': { ewo: 'Nyí a nòng móni', phonetic: 'nyí à nòŋ mó-ní' },
  'bénéficiaires': { ewo: 'Bá ba nòng móni', phonetic: 'bá bà nòŋ mó-ní' },
  'beneficiaires': { ewo: 'Bá ba nòng móni', phonetic: 'bá bà nòŋ mó-ní' },
  'destinataire': { ewo: 'Nyí a nòng móni', phonetic: 'nyí à nòŋ mó-ní' },
  'destinataires': { ewo: 'Bá ba nòng móni', phonetic: 'bá bà nòŋ mó-ní' },
  'expéditeur': { ewo: 'Nyí a lóm móni', phonetic: 'nyí à lóm mó-ní' },
  'expediteur': { ewo: 'Nyí a lóm móni', phonetic: 'nyí à lóm mó-ní' },

  // History & Transactions
  'historique des transactions': { ewo: 'Minlóm mí ayáa lót', phonetic: 'mì-n-lóm mí à-yá-á lót' },
  'historique des opérations': { ewo: 'Minlóm mí ayáa lót', phonetic: 'mì-n-lóm mí à-yá-á lót' },
  'historique': { ewo: 'Minlóm mí ayáa lót', phonetic: 'mì-n-lóm mí à-yá-á lót' },
  'transactions récentes': { ewo: 'Minlóm mí móni mímpepe', phonetic: 'mì-n-lóm mí mó-ní mím-pè-pè' },
  'transactions': { ewo: 'Minlóm mí móni', phonetic: 'mì-n-lóm mí mó-ní' },
  'transaction': { ewo: 'Nlóm móni', phonetic: 'n-lóm mó-ní' },
  'opérations': { ewo: 'Minlóm mí móni', phonetic: 'mì-n-lóm mí mó-ní' },
  'operations': { ewo: 'Minlóm mí móni', phonetic: 'mì-n-lóm mí mó-ní' },
  'opération': { ewo: 'Nlóm móni', phonetic: 'n-lóm mó-ní' },
  'operation': { ewo: 'Nlóm móni', phonetic: 'n-lóm mó-ní' },

  // Security & Authentication
  'sécurité': { ewo: 'Mbaán', phonetic: 'm-ba-án' },
  'securite': { ewo: 'Mbaán', phonetic: 'm-ba-án' },
  'sécurisé': { ewo: 'É ne mbaán', phonetic: 'é né m-ba-án' },
  'securise': { ewo: 'É ne mbaán', phonetic: 'é né m-ba-án' },
  'en sécurité': { ewo: 'É ne mbaán', phonetic: 'é né m-ba-án' },
  'authentification': { ewo: 'Yêm émòt', phonetic: 'yêm é-mòt' },
  'connexion': { ewo: 'Nyin', phonetic: 'nyin' },
  'se connecter': { ewo: 'Nyin', phonetic: 'nyin' },
  'connectez-vous': { ewo: 'Nyin', phonetic: 'nyin' },
  'connectez-vous à votre compte': { ewo: 'Nyin ékóbló wên', phonetic: 'nyin é-kó-bló wên' },
  'connecté': { ewo: 'Á nyin', phonetic: 'á nyin' },
  'connectee': { ewo: 'Á nyin', phonetic: 'á nyin' },
  'déconnexion': { ewo: 'Kwi', phonetic: 'kwi' },
  'se déconnecter': { ewo: 'Kwi', phonetic: 'kwi' },
  'déconnectez-vous': { ewo: 'Kwi', phonetic: 'kwi' },
  'carte': { ewo: 'Kaladí móni', phonetic: 'kà-là-dí mó-ní' },
  'cartes': { ewo: 'Mekaladí mé móni', phonetic: 'me-kà-là-dí mé mó-ní' },
  'carte bancaire': { ewo: 'Kaladí nda móni', phonetic: 'kà-là-dí n-da mó-ní' },
  'carte de crédit': { ewo: 'Kaladí kálá móni', phonetic: 'kà-là-dí ká-lá mó-ní' },
  'code': { ewo: 'Ndámbá tsíti', phonetic: 'n-dám-bá tsí-tí' },
  'code secret': { ewo: 'Ndámbá tsíti', phonetic: 'n-dám-bá tsí-tí' },
  'mot de passe': { ewo: 'Ndámbá tsíti', phonetic: 'n-dám-bá tsí-tí' },
  'pin': { ewo: 'Ndámbá tsíti', phonetic: 'n-dám-bá tsí-tí' },
  'entrez votre code secret': { ewo: 'Tsilí ndámbá tsíti wên', phonetic: 'tsì-lí n-dám-bá tsí-tí wên' },

  // Buttons & Interactions
  'confirmer le transfert': { ewo: 'Tíbíli tóbó nlóm', phonetic: 'tí-bí-lí tó-bó n-lóm' },
  'confirmer': { ewo: 'Tíbíli tóbó', phonetic: 'tí-bí-lí tó-bó' },
  'valider': { ewo: 'Tíbíli tóbó', phonetic: 'tí-bí-lí tó-bó' },
  'annuler': { ewo: 'Dzágbá', phonetic: 'dzá-gbá' },
  'partager': { ewo: 'Kábán', phonetic: 'ká-bán' },
  'voir': { ewo: 'Yên', phonetic: 'yên' },
  'continuer': { ewo: 'Kë ôsu', phonetic: 'kë ô-su' },
  'suivant': { ewo: 'Nyí a yáa zu', phonetic: 'nyí à yá-á zu' },
  'précédent': { ewo: 'Nyí a lót', phonetic: 'nyí à lót' },
  'precedent': { ewo: 'Nyí a lót', phonetic: 'nyí à lót' },
  'fermer': { ewo: 'Dib', phonetic: 'dib' },
  'ouvrir': { ewo: 'Yob', phonetic: 'yob' },
  'supprimer': { ewo: 'Dim', phonetic: 'dim' },
  'modifier': { ewo: 'Tsindin', phonetic: 'tsin-din' },
  'enregistrer': { ewo: 'Bóm', phonetic: 'bóm' },
  'recherche': { ewo: 'Dzën', phonetic: 'dzèŋ' },
  'rechercher': { ewo: 'Dzën', phonetic: 'dzèŋ' },

  // Communication, Support & Details
  'aide et support': { ewo: 'Nvôl ai nkobó', phonetic: 'n-vôl a-í n-ko-bó' },
  'aide': { ewo: 'Nvôl', phonetic: 'n-vôl' },
  'support client': { ewo: 'Nvôl émòt', phonetic: 'n-vôl é-mòt' },
  'contactez-nous': { ewo: 'Kòbò ai bía', phonetic: 'kò-bò a-í bí-a' },
  'contact': { ewo: 'Kòbò ai bía', phonetic: 'kò-bò a-í bí-a' },
  'téléphone': { ewo: 'Nlambá telefôn', phonetic: 'n-làm-bá té-lé-fôn' },
  'telephone': { ewo: 'Nlambá telefôn', phonetic: 'n-làm-bá té-lé-fôn' },
  'numero de telephone': { ewo: 'Nlambá telefôn', phonetic: 'n-làm-bá té-lé-fôn' },
  'numéro de téléphone': { ewo: 'Nlambá telefôn', phonetic: 'n-làm-bá té-lé-fôn' },
  'date': { ewo: 'Mos', phonetic: 'mos' },
  'heure': { ewo: 'Ngeŋ', phonetic: 'ŋeŋ' },
  'échéance': { ewo: 'Mos yá manë', phonetic: 'mos yá ma-në' },
  'echeance': { ewo: 'Mos yá manë', phonetic: 'mos yá ma-në' },
  'statut': { ewo: 'Ne dé', phonetic: 'ne dé' },
  'réussi': { ewo: 'L ayáa dúa', phonetic: 'l à-yá-á dú-á' },
  'succès': { ewo: 'L ayáa dúa', phonetic: 'l à-yá-á dú-á' },
  'succes': { ewo: 'L ayáa dúa', phonetic: 'l à-yá-á dú-á' },
  'effectué': { ewo: 'L ayáa dúa', phonetic: 'l à-yá-á dú-á' },
  'effectue': { ewo: 'L ayáa dúa', phonetic: 'l à-yá-á dú-á' },
  'échec': { ewo: 'L abê dúa', phonetic: 'l à-bé dú-á' },
  'echec': { ewo: 'L abê dúa', phonetic: 'l à-bé dú-á' },
  'en cours': { ewo: 'É ngá bɔban', phonetic: 'é ŋá bò-ban' },
  'en attente': { ewo: 'É ngá yange', phonetic: 'é ŋá yaŋ-ge' },
  'service': { ewo: 'Ésë', phonetic: 'é-së' },
  'services': { ewo: 'Mésë', phonetic: 'mé-së' },
  'nos services': { ewo: 'Mésë mama', phonetic: 'mé-së ma-ma' },
  'services bancaires': { ewo: 'Mésë mé nda móni', phonetic: 'mé-së mé n-da mó-ní' },
  'notification': { ewo: 'Nkat', phonetic: 'n-kat' },
  'notifications': { ewo: 'Minkat', phonetic: 'mìn-kat' },
  'message': { ewo: 'Nkat', phonetic: 'n-kat' },
  'messages': { ewo: 'Minkat', phonetic: 'mìn-kat' },
  'bonjour': { ewo: 'Mbólo', phonetic: 'm-bó-lo' },
  'bonsoir': { ewo: 'Mbólo ngoge', phonetic: 'm-bó-lo ŋo-ge' },
  'merci': { ewo: 'Akíba', phonetic: 'a-kí-ba' },
  'merci de votre confiance': { ewo: 'Akíba', phonetic: 'a-kí-ba' },
  'oui': { ewo: 'Éyé', phonetic: 'é-yé' },
  'non': { ewo: 'Tégé', phonetic: 'té-gé' },
  'attention': { ewo: 'Tábé aí mesó', phonetic: 'tá-bé a-í me-só' },

  // Prepositions, Pronouns & Everyday Connectives
  'sur': { ewo: 'á', phonetic: 'á' },
  'dans': { ewo: 'été', phonetic: 'é-té' },
  'en': { ewo: 'é', phonetic: 'é' },
  'pour': { ewo: 'asú', phonetic: 'a-sú' },
  'avec': { ewo: 'aí', phonetic: 'a-í' },
  'sans': { ewo: 'tégé', phonetic: 'té-gé' },
  'vers': { ewo: 'é be', phonetic: 'é be' },
  'de': { ewo: 'yá', phonetic: 'yá' },
  'du': { ewo: 'yá', phonetic: 'yá' },
  'des': { ewo: 'mé', phonetic: 'mé' },
  'et': { ewo: 'aí', phonetic: 'a-í' },
  'ou': { ewo: 'ngé', phonetic: 'ngé' },
  'est': { ewo: 'ne', phonetic: 'ne' },
  'sont': { ewo: 'bé ne', phonetic: 'bé ne' },
  'votre': { ewo: 'wên', phonetic: 'wên' },
  'vos': { ewo: 'mên', phonetic: 'mên' },
  'notre': { ewo: 'wís', phonetic: 'wís' },
  'nos': { ewo: 'mís', phonetic: 'mís' },
  'mon': { ewo: 'wama', phonetic: 'wa-ma' },
  'ma': { ewo: 'wama', phonetic: 'wa-ma' },
  'mes': { ewo: 'mama', phonetic: 'ma-ma' },
  'tout': { ewo: 'mësë', phonetic: 'më-së' },
  'tous': { ewo: 'bësë', phonetic: 'bë-së' },
  'toute': { ewo: 'ésë', phonetic: 'é-së' },
  'homme': { ewo: 'môt', phonetic: 'môt' },
  'femme': { ewo: 'minga', phonetic: 'min-ga' },
  'personne': { ewo: 'môt', phonetic: 'môt' },
  'gens': { ewo: 'bôt', phonetic: 'bôt' },
  'village': { ewo: 'dzal', phonetic: 'dzal' },
  'porte': { ewo: 'mbè', phonetic: 'm-bè' },
  'annee': { ewo: 'mbu', phonetic: 'm-bu' },
  'année': { ewo: 'mbu', phonetic: 'm-bu' },
  'jour': { ewo: 'mos', phonetic: 'mos' },
  'mois': { ewo: 'ngon', phonetic: 'ngon' },
};

// Build fast word lookup maps
const frToEwoMap = new Map<string, string>();
const enToEwoMap = new Map<string, string>();
const ewoPhoneticMap = new Map<string, string>();

// 1. Ingest Apertium entries
for (const entry of APERTIUM_EWONDO_ENTRIES) {
  const normFra = entry.fra.toLowerCase().trim();
  if (normFra && entry.ewo) {
    if (!frToEwoMap.has(normFra)) {
      frToEwoMap.set(normFra, entry.ewo);
    }
  }
}

// 2. Ingest Financial Glossary
for (const term of FINANCIAL_GLOSSARY_ENTRIES) {
  const normFra = term.fra.toLowerCase().trim();
  frToEwoMap.set(normFra, term.ewo);
  if (term.en) {
    enToEwoMap.set(term.en.toLowerCase().trim(), term.ewo);
  }
  if (term.phonetic) {
    ewoPhoneticMap.set(term.ewo.toLowerCase().trim(), term.phonetic);
  }
}

// 3. Ingest Extended Banking & UI
for (const [key, val] of Object.entries(EXTENDED_BANKING_UI_LEXICON)) {
  const norm = key.toLowerCase().trim();
  frToEwoMap.set(norm, val.ewo);
  if (val.phonetic) {
    ewoPhoneticMap.set(val.ewo.toLowerCase().trim(), val.phonetic);
  }
}

export function lookupEwondoWord(frenchWord: string): string | null {
  const norm = frenchWord.toLowerCase().trim();
  return frToEwoMap.get(norm) || null;
}

export function lookupEwondoFromEnglish(englishWord: string): string | null {
  const norm = englishWord.toLowerCase().trim();
  return enToEwoMap.get(norm) || null;
}

export function getEwondoPhonetic(ewondoText: string): string {
  const norm = ewondoText.toLowerCase().trim();
  if (ewoPhoneticMap.has(norm)) {
    return ewoPhoneticMap.get(norm)!;
  }
  // Generate phonetic approximation suitable for speech synthesis articulation
  return ewondoText
    .replace(/ɔ́/g, 'ó')
    .replace(/ɔ̀/g, 'ò')
    .replace(/ɔ/g, 'o')
    .replace(/ɛ́/g, 'é')
    .replace(/ɛ̀/g, 'è')
    .replace(/ɛ/g, 'e')
    .replace(/ə́/g, 'é')
    .replace(/ə̀/g, 'è')
    .replace(/ə/g, 'e')
    .replace(/ë/g, 'e')
    .replace(/ŋ/g, 'ng')
    .replace(/kp/g, 'kp')
    .replace(/gb/g, 'gb')
    .replace(/[\\u0300-\\u036f]/g, '');
}

export function translateSentenceToEwondo(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;

  // 1. Direct multi-word / exact check
  const exact = lookupEwondoWord(trimmed);
  if (exact) {
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 1) {
      return exact.toUpperCase();
    }
    if (trimmed[0] === trimmed[0].toUpperCase()) {
      return exact.charAt(0).toUpperCase() + exact.slice(1);
    }
    return exact;
  }

  // 2. Financial transfer pattern: "Transfert de 15 000 FCFA vers le +237 699 123 456"
  const transferMatch = trimmed.match(
    /(?:transfert|virement|paiement|envoi)\\s+(?:de\\s+)?(\\d[\\d\\s,.\\u00a0]*\\s*(?:FCFA|XAF|CFA)?)\\s+(?:vers|à|au)\\s+([^\\-]+)(?:\\s*-\\s*(.*))?/i
  );
  if (transferMatch) {
    const amount = transferMatch[1].trim();
    const recipient = transferMatch[2].trim();
    const reason = transferMatch[3] ? \` - \${transferMatch[3].trim()}\` : '';
    return \`Lóm móni mé \${amount} é be \${recipient}\${reason}\`;
  }

  // 3. Amount pattern: "Solde de 250 000 FCFA"
  const balanceMatch = trimmed.match(/(?:solde|balance)\\s+(?:est\\s+de\\s+|de\\s+|disponible\\s*:?\\s*)?(\\d[\\d\\s,.\\u00a0]*\\s*(?:FCFA|XAF|CFA)?)/i);
  if (balanceMatch && balanceMatch[1]) {
    return \`Móni mí ne: \${balanceMatch[1].trim()}\`;
  }

  // 4. Multi-word phrases with Unicode boundary matching (sorted by descending length)
  let workingText = trimmed;
  const multiWordKeys = Array.from(frToEwoMap.keys())
    .filter((k) => k.includes(' ') || k.includes(\"'\"))
    .sort((a, b) => b.length - a.length);

  for (const phrase of multiWordKeys) {
    const escaped = escapeRegExp(phrase);
    const regex = new RegExp(\`(?:^|([^\\\\p{L}\\\\p{N}]))\${escaped}(?=[^\\\\p{L}\\\\p{N}]|$)\`, 'giu');
    if (regex.test(workingText)) {
      const repl = frToEwoMap.get(phrase)!;
      workingText = workingText.replace(regex, (_m, p1 = '') => {
        return p1 + repl;
      });
    }
  }

  // 5. Individual tokens & French elision handling
  const words = workingText.split(/(\\s+|[,;:.!?()\\/\\-]|(?<=[ldcsqnjm]['’])(?=[\\p{L}]))/u);
  const translatedTokens: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const token = words[i];
    if (!token) continue;

    // Preserve whitespace, punctuation, delimiters
    if (/^(\\s+|[,;:.!?()\\/\\-])$/.test(token)) {
      translatedTokens.push(token);
      continue;
    }
    // Preserve pure numbers and currency codes
    if (/^[\\d\\s.,\\u00a0]+$/.test(token) || /^(FCFA|XAF|CFA|EUR|USD|XOF)$/i.test(token)) {
      translatedTokens.push(token);
      continue;
    }

    // Check if current token is an elision prefix like "d'", "l'", "c'", "s'", "n'", "qu'"
    if (/^[ldcsqnjm]['’]$/i.test(token)) {
      let nextWordIdx = i + 1;
      while (nextWordIdx < words.length && !words[nextWordIdx]) nextWordIdx++;
      if (nextWordIdx < words.length) {
        const nextWord = words[nextWordIdx];
        const matchNext = lookupEwondoWord(nextWord);
        if (matchNext) {
          let result = matchNext;
          if (nextWord === nextWord.toUpperCase() && nextWord.length > 1) {
            result = matchNext.toUpperCase();
          } else if (token[0] === token[0].toUpperCase()) {
            result = matchNext.charAt(0).toUpperCase() + matchNext.slice(1);
          }
          translatedTokens.push(result);
          i = nextWordIdx;
          continue;
        }
      }
      translatedTokens.push(token);
      continue;
    }

    // Direct word lookup
    const match = lookupEwondoWord(token);
    if (match) {
      let result = match;
      if (token === token.toUpperCase() && token.length > 1) {
        result = match.toUpperCase();
      } else if (token[0] === token[0].toUpperCase()) {
        result = match.charAt(0).toUpperCase() + match.slice(1);
      }
      translatedTokens.push(result);
      continue;
    }

    translatedTokens.push(token);
  }

  return translatedTokens.join('');
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
}
`;

fs.writeFileSync(outPath, code, 'utf8');
console.log('Successfully built packages/translation-engine/src/providers/ewondo-lexicon.ts');
