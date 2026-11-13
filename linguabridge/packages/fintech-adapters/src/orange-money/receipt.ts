import { FinancialEntityExtractor } from '@linguabridge/financial-domain';
import { ZeroDriftViolationError } from '../errors';
import type { OrangeMoneyReceipt, OrangeMoneyReceiptOptions, OrangeMoneyWebhookEvent } from '../types';

const extractor = new FinancialEntityExtractor();

/**
 * Normalizes monetary amount to include currency suffix if not already present.
 */
function formatMonetary(amount: string | number, currency: string): string {
  const str = String(amount).trim();
  if (/[A-Za-z]/.test(str)) {
    return str;
  }
  return `${str} ${currency}`;
}

/**
 * Generates a localized digital receipt ("Kaladí nláman") in sovereign African languages (e.g. Ewondo)
 * with strict zero-drift verification preserving amounts, fees, customer phone, and transaction references.
 */
export function generateOrangeMoneyReceipt(
  event: OrangeMoneyWebhookEvent,
  targetLang = 'ewo-CM',
  options?: OrangeMoneyReceiptOptions
): OrangeMoneyReceipt {
  const strict = options?.strict ?? true;

  // Header in certified Ewondo terminology: "Kaladí nláman" (Reçu numérique)
  const header = options?.header ?? (targetLang.startsWith('ewo') ? 'Kaladí nláman' : 'Digital Receipt');
  const title = targetLang.startsWith('ewo')
    ? 'Kaladí nláman yá Orange Money'
    : 'Orange Money Payment Receipt';

  const formattedAmount = formatMonetary(event.amount, event.currency);
  const formattedFee = formatMonetary(event.fee ?? 0, event.currency);
  const dateStr = options?.date ?? (event.timestamp ? event.timestamp.split('T')[0] : new Date().toISOString().split('T')[0]);

  let statusText = event.status;
  if (targetLang.startsWith('ewo')) {
    if (event.status === 'SUCCESS') statusText = 'Ayáa dúa (Succès)';
    else if (event.status === 'FAILED') statusText = 'Tekeg dúa (Échec)';
    else statusText = 'Ngbat (En attente)';
  }

  // Construct formatted receipt text
  const lines: string[] = [
    '========================================',
    `             ${header.toUpperCase()}`,
    '========================================',
    `ID Transaction: ${event.transactionId}`,
    `ID Order: ${event.orderId}`,
    `Mos (Date): ${dateStr}`,
    `Móni (Montant): ${formattedAmount}`,
    `Móni mfá (Frais): ${formattedFee}`,
    `Sámbá (Téléphone): ${event.customerPhone}`,
    `Status: ${statusText}`,
  ];

  if (options?.merchantName || event.merchantId) {
    lines.push(`Marchand: ${options?.merchantName || event.merchantId}`);
  }

  lines.push('========================================');
  const formattedText = lines.join('\n');

  // Build baseline source text representing the financial ground truth
  const sourceBaseline = [
    `Montant: ${formattedAmount}`,
    `Frais: ${formattedFee}`,
    `Telephone: ${event.customerPhone}`,
    `Transaction: ${event.transactionId}`,
    `Order: ${event.orderId}`,
    `Date: ${dateStr}`,
    ...(event.merchantId ? [`Merchant: ${event.merchantId}`] : []),
  ].join('\n');

  // Verify Zero-Drift AST integrity
  const sourceEntities = extractor.extract(sourceBaseline);
  const receiptEntities = extractor.extract(formattedText);
  const guard = extractor.compare(sourceEntities, receiptEntities);

  if (!guard.safe) {
    if (strict) {
      const issues = guard.violations.map((v) => v.issue).join('; ');
      throw new ZeroDriftViolationError(
        `Financial zero-drift violation in Orange Money receipt ("${header}"): ${issues}`,
        guard
      );
    }
  }

  return {
    header,
    title,
    transactionId: event.transactionId,
    orderId: event.orderId,
    amount: formattedAmount,
    currency: event.currency,
    fee: formattedFee,
    customerPhone: event.customerPhone,
    date: dateStr,
    status: event.status,
    formattedText,
    text: formattedText,
    targetLang,
    verified: guard.safe,
    safe: guard.safe,
    sourceFingerprint: guard.sourceFingerprint,
    translatedFingerprint: guard.translatedFingerprint,
  };
}
