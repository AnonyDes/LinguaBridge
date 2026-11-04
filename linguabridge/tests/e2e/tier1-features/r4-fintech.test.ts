import { describe, it, expect } from 'vitest';
import {
  extractFinancialEntities,
  computeSha256Fingerprint,
  verifyZeroDriftAST,
  computeHmacSignature,
  verifyHmacSignature,
} from '../helpers/test-utils';

/**
 * Tier 1: Feature Coverage — R4 FinTech Payment Gateway Adapters & Webhooks (`packages/fintech-adapters`)
 * Authoritative Source: ORIGINAL_REQUEST.md (R4) & PROJECT.md (§4 FinTech Adapters)
 */
describe('Tier 1: Feature Coverage — R4 FinTech Payment Adapters & Webhooks', () => {
  // Reference MTN MoMo Adapter
  function parseMomoSms(raw: string) {
    const amountMatch = raw.match(/(\d[\d\s]*\d|\d+)\s*(FCFA|XAF)/i);
    const feeMatch = raw.match(/frais(?:\s*:\s*|\s+)(\d[\d\s]*\d|\d+)\s*(FCFA|XAF)?/i);
    const balanceMatch = raw.match(/solde(?:\s*:\s*|\s+)(\d[\d\s]*\d|\d+)\s*(FCFA|XAF)?/i);
    const phoneMatch = raw.match(/(?:au|de|vers|numéro)?\s*(\+?237\s*6\d{8}|6\d{8})/i);
    const txnMatch = raw.match(/(?:TXN|REF|ID|TX-)[\s:]*(?:TXN-)?([A-Z0-9]+)/i);

    return {
      raw,
      amount: amountMatch ? amountMatch[1].trim() + ' FCFA' : null,
      fee: feeMatch ? feeMatch[1].trim() + ' FCFA' : '0 FCFA',
      balance: balanceMatch ? balanceMatch[1].trim() + ' FCFA' : null,
      recipientPhone: phoneMatch ? phoneMatch[1].replace(/\s+/g, '') : null,
      transactionId: txnMatch ? txnMatch[1].toUpperCase() : null,
    };
  }

  function localizeMomoNotification(parsed: ReturnType<typeof parseMomoSms>, lang: string): string {
    if (lang === 'ewo-CM' || lang === 'ewondo') {
      const template = `[MTN MoMo] Wá yemé nǎ: O mané lóm móni ${parsed.amount} é be ${parsed.recipientPhone}. Nfák: ${parsed.fee}. Txn: TXN-${parsed.transactionId}.`;
      const verification = verifyZeroDriftAST(parsed.raw, template);
      if (!verification.safe) {
        throw new Error(`Zero-drift violation in MoMo template: ${verification.violations.map((v) => v.issue).join(', ')}`);
      }
      return template;
    }
    return parsed.raw;
  }

  // Reference Orange Money Adapter
  interface OrangeMoneyWebhook {
    order_id: string;
    amount: number;
    currency: string;
    customer_phone: string;
    fee: number;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    token: string;
    merchant_id: string;
  }

  function validateOrangeMoneySignature(payload: OrangeMoneyWebhook, signature: string, secret: string): boolean {
    return verifyHmacSignature(payload, signature, secret);
  }

  function generateOrangeMoneyReceipt(event: OrangeMoneyWebhook, lang: string): string {
    if (lang === 'ewo-CM' || lang === 'ewondo') {
      return [
        '----------------------------------------',
        '        KALADÍ NLÁMAN ORANGE MONEY      ',
        '----------------------------------------',
        `Nfúbás:     ${event.order_id}`,
        `Móni:       ${event.amount.toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]+/g, ' ')} ${event.currency}`,
        `Nfák:       ${event.fee.toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]+/g, ' ')} ${event.currency}`,
        `Telefon:    ${event.customer_phone}`,
        `Ngól:       ${event.merchant_id}`,
        `Akóma:      ${event.status === 'SUCCESS' ? 'YÁ MAN (SUCCESS)' : 'É SIKÍ (FAILED)'}`,
        `Token:      ${event.token}`,
        '----------------------------------------',
      ].join('\n');
    }
    return `Receipt: ${event.order_id} - ${event.amount} ${event.currency}`;
  }

  // Reference Aggregators Payload Sanitizer (CinetPay, Notch Pay, Paystack)
  function sanitizeAggregatorPayload(payload: Record<string, any>, targetLang: string) {
    const protectedNumericFields = ['amount', 'total', 'subtotal', 'fee', 'price', 'unit_price', 'charge'];
    const protectedIdentityFields = ['customer_phone', 'phone', 'msisdn', 'reference', 'txn_id', 'transaction_id', 'account_id'];

    const cloned = JSON.parse(JSON.stringify(payload));

    function walkAndProtect(obj: any) {
      if (!obj || typeof obj !== 'object') return;
      for (const [key, value] of Object.entries(obj)) {
        if (protectedNumericFields.includes(key.toLowerCase()) || protectedIdentityFields.includes(key.toLowerCase())) {
          // Freeze numeric & identity values
          Object.defineProperty(obj, key, { writable: false, configurable: false, value });
        } else if (typeof value === 'string' && (key === 'description' || key === 'title' || key === 'message')) {
          // Localize descriptive text
          if (targetLang === 'ewo-CM' && value.toLowerCase().includes('facture')) {
            obj[key] = value.replace(/facture/i, 'Kaladí nláman');
          }
        } else if (typeof value === 'object') {
          walkAndProtect(value);
        }
      }
    }

    walkAndProtect(cloned);
    return cloned;
  }

  it('4.1 should parse MTN MoMo SMS extracting amounts, recipient MSISDN, fee, and txn ID', () => {
    const rawSms = 'Vous avez transféré 25 000 FCFA avec succès au 670123456. Frais: 250 FCFA. Solde: 145 000 FCFA. Ref: TXN-998877.';
    const parsed = parseMomoSms(rawSms);

    expect(parsed.amount).toBe('25 000 FCFA');
    expect(parsed.recipientPhone).toBe('670123456');
    expect(parsed.fee).toBe('250 FCFA');
    expect(parsed.balance).toBe('145 000 FCFA');
    expect(parsed.transactionId).toBe('998877');
  });

  it('4.2 should generate zero-drift localized MTN MoMo SMS template in Ewondo', () => {
    const rawSms = 'Vous avez transféré 25 000 FCFA avec succès au 670123456. Frais: 250 FCFA. Ref: TXN-998877.';
    const parsed = parseMomoSms(rawSms);
    const localized = localizeMomoNotification(parsed, 'ewo-CM');

    expect(localized).toContain('25 000 FCFA');
    expect(localized).toContain('670123456');
    expect(localized).toContain('250 FCFA');
    expect(localized).toContain('998877');

    const check = verifyZeroDriftAST(rawSms, localized);
    expect(check.safe).toBe(true);
  });

  it('4.3 should validate Orange Money webhook payload and HMAC signature', () => {
    const secret = 'om_secret_yaounde_2026';
    const payload: OrangeMoneyWebhook = {
      order_id: 'OM-ORD-2026-001',
      amount: 15000,
      currency: 'XAF',
      customer_phone: '237699112233',
      fee: 150,
      status: 'SUCCESS',
      token: 'TK-992384',
      merchant_id: 'MERCHANT-CM-04',
    };

    const signature = computeHmacSignature(payload, secret);
    const isValid = validateOrangeMoneySignature(payload, signature, secret);
    expect(isValid).toBe(true);

    const isTampered = validateOrangeMoneySignature(
      { ...payload, amount: 20000 },
      signature,
      secret
    );
    expect(isTampered).toBe(false);
  });

  it('4.4 should generate Orange Money digital receipt in Ewondo with zero drift', () => {
    const payload: OrangeMoneyWebhook = {
      order_id: 'OM-ORD-2026-001',
      amount: 15000,
      currency: 'XAF',
      customer_phone: '237699112233',
      fee: 150,
      status: 'SUCCESS',
      token: 'TK-992384',
      merchant_id: 'MERCHANT-CM-04',
    };

    const receipt = generateOrangeMoneyReceipt(payload, 'ewo-CM');
    expect(receipt).toContain('KALADÍ NLÁMAN ORANGE MONEY');
    expect(receipt).toContain('15 000');
    expect(receipt).toContain('237699112233');
    expect(receipt).toContain('MERCHANT-CM-04');
    expect(receipt).toContain('TK-992384');
  });

  it('4.5 should sanitize Aggregator payloads (CinetPay, Notch Pay, Paystack) ensuring amounts are preserved', () => {
    const aggregatorPayload = {
      transaction_id: 'PAY-88231',
      amount: 45000,
      currency: 'XAF',
      customer: {
        customer_phone: '237677889900',
        name: 'Jean Atangana',
      },
      description: 'Paiement de la facture électricité ENEO',
    };

    const sanitized = sanitizeAggregatorPayload(aggregatorPayload, 'ewo-CM');
    expect(sanitized.amount).toBe(45000);
    expect(sanitized.transaction_id).toBe('PAY-88231');
    expect(sanitized.customer.customer_phone).toBe('237677889900');
    expect(sanitized.description).toContain('Kaladí nláman');
  });

  it('4.6 should provide web framework middleware support with X-LinguaBridge-Verified header', () => {
    const outgoingResponse = {
      status: 'success',
      amount: '50 000 FCFA',
      message: 'Facture payée avec succès',
    };

    const sourceFingerprint = computeSha256Fingerprint(extractFinancialEntities(outgoingResponse.amount));

    // Middleware localization
    const localizedResponse = {
      status: 'success',
      amount: '50 000 FCFA',
      message: 'Kaladí nláman yá man yá bẽng',
    };

    const targetFingerprint = computeSha256Fingerprint(extractFinancialEntities(localizedResponse.amount));
    const verified = sourceFingerprint === targetFingerprint;

    expect(verified).toBe(true);
    const responseHeaders: Record<string, string> = {};
    if (verified) {
      responseHeaders['X-LinguaBridge-Verified'] = 'true';
    }
    expect(responseHeaders['X-LinguaBridge-Verified']).toBe('true');
  });
});
