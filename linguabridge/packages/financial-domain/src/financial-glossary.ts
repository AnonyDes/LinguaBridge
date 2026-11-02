// Financial terminology — French/English pairs
// DO NOT add Cameroonian language equivalents until verified by a linguist
export const FINANCIAL_GLOSSARY_FR_EN: Record<string, string> = {
  'solde': 'balance',
  'virement': 'transfer',
  'retrait': 'withdrawal',
  'dépôt': 'deposit',
  'frais': 'fees',
  'taux': 'rate',
  'bénéficiaire': 'beneficiary',
  'confirmer': 'confirm',
  'annuler': 'cancel',
  'historique': 'history',
  'transaction': 'transaction',
  'compte': 'account',
  'montant': 'amount',
  'devise': 'currency',
  'remboursement': 'refund',
  'prêt': 'loan',
  'intérêt': 'interest',
  'échéance': 'due date',
  'relevé': 'statement',
  'vérification': 'verification',
  'consentement': 'consent',
};

export const HIGH_RISK_OPERATIONS = [
  'transfer',
  'virement',
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
