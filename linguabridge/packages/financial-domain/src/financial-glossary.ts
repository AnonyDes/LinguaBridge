// Financial terminology — French/English reference pairs
export const FINANCIAL_GLOSSARY_FR_EN: Record<string, string> = {
  'solde': 'balance',
  'virement': 'transfer',
  'transfert': 'transfer',
  'retrait': 'withdrawal',
  'dépôt': 'deposit',
  'depot': 'deposit',
  'frais': 'fees',
  'taux': 'rate',
  'bénéficiaire': 'beneficiary',
  'beneficiaire': 'beneficiary',
  'confirmer': 'confirm',
  'annuler': 'cancel',
  'historique': 'history',
  'transaction': 'transaction',
  'compte': 'account',
  'montant': 'amount',
  'devise': 'currency',
  'remboursement': 'refund',
  'prêt': 'loan',
  'pret': 'loan',
  'intérêt': 'interest',
  'interet': 'interest',
  'échéance': 'due date',
  'echeance': 'due date',
  'relevé': 'statement',
  'releve': 'statement',
  'vérification': 'verification',
  'verification': 'verification',
  'consentement': 'consent',
  'tontine': 'tontine',
};

export const HIGH_RISK_OPERATIONS = [
  'transfer',
  'virement',
  'transfert',
  'payment',
  'paiement',
  'withdrawal',
  'retrait',
  'confirm',
  'confirmer',
  'authorize',
  'autoriser',
];

export function isHighRiskOperation(text: string): boolean {
  const lower = text.toLowerCase();
  return HIGH_RISK_OPERATIONS.some((op) => lower.includes(op));
}
