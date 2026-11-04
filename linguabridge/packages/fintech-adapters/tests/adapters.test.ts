import { describe, it, expect } from 'vitest';
import {
  parseMomoSms,
  localizeMomoNotification,
  parseOrangeMoneyWebhook,
  validateOrangeMoneySignature,
  generateOrangeMoneyReceipt,
  sanitizeAggregatorPayload,
  createAggregatorSanitizer,
  linguaBridgeExpress,
  linguaBridgeFastify,
  withLinguaBridge,
} from '../src';
import { createHmac } from 'node:crypto';

describe('@linguabridge/fintech-adapters Specification Suite', () => {
  describe('MTN Mobile Money (MoMo) Adapter', () => {
    it('parses MTN MoMo transfer notification and extracts monetary figures', () => {
      const sms = 'Transfert de 5 000 FCFA vers le +237 699 123 456 réussi. Frais: 100 FCFA. Nouveau solde: 45 000 FCFA. ID: MP260312.0001';
      const parsed = parseMomoSms(sms);

      expect(parsed).toBeDefined();
      expect(parsed.type).toBe('sent');
      expect(parsed.amount).toBeDefined();
      expect(parsed.amount).toContain('5 000');
      expect(parsed.fee).toBeDefined();
      expect(parsed.balance).toBeDefined();
      expect(parsed.recipient).toBeDefined();
    });

    it('localizes MoMo notification into Ewondo with zero-drift financial verification', async () => {
      const sms = 'Transfert de 5 000 FCFA vers le +237 699 123 456 réussi. Frais: 100 FCFA. Nouveau solde: 45 000 FCFA.';
      const localized = localizeMomoNotification(sms, 'ewo-CM');

      expect(typeof localized).toBe('string');
      expect(localized).toContain('5 000');
      expect(localized).toContain('100');
      expect(localized).toContain('45 000');
    });
  });

  describe('Orange Money Webhook & Signature Verification', () => {
    const secret = 'om_secret_2026_central_africa';
    const omPayload = {
      order_id: 'OM-TX-998822',
      amount: 25000,
      currency: 'XAF',
      client_msisdn: '237699443322',
      status: 'SUCCESS',
      description: 'Paiement de facture Eneo',
    };

    it('validates HMAC-SHA256 signature correctly', () => {
      const payloadString = JSON.stringify(omPayload);
      const signature = createHmac('sha256', secret).update(payloadString).digest('hex');

      const isValid = validateOrangeMoneySignature(payloadString, signature, secret);
      expect(isValid).toBe(true);

      const isInvalid = validateOrangeMoneySignature(payloadString, 'bad_signature_hash', secret);
      expect(isInvalid).toBe(false);
    });

    it('parses Orange Money webhook payload', () => {
      const parsed = parseOrangeMoneyWebhook(omPayload);
      expect(parsed.amount).toBe(25000);
      expect(parsed.currency).toBe('XAF');
      expect(parsed.transactionId).toBe('OM-TX-998822');
      expect(parsed.customerPhone).toBe('237699443322');
    });

    it('generates zero-drift digital receipt in Ewondo', async () => {
      const parsed = parseOrangeMoneyWebhook(omPayload);
      const receipt = generateOrangeMoneyReceipt(parsed, 'ewo-CM');

      expect(receipt.safe).toBe(true);
      expect(receipt.text).toContain('25000');
      expect(receipt.text).toContain('OM-TX-998822');
      expect(receipt.text).toContain('237699443322');
    });
  });

  describe('Payment Aggregators Sanitizer (CinetPay, Notch Pay, Paystack)', () => {
    it('sanitizes CinetPay payload, translating description while protecting amounts and IDs', async () => {
      const cinetPayPayload = {
        cpm_trans_id: 'CP-2026-00441',
        cpm_amount: '15000',
        cpm_currency: 'XAF',
        cpm_phone_prefixe: '237',
        cpm_customer_phone: '670001122',
        description: 'Paiement marchand',
      };

      const result = sanitizeAggregatorPayload(cinetPayPayload, 'ewo-CM');

      expect(result.cpm_trans_id).toBe('CP-2026-00441');
      expect(result.cpm_amount).toBe('15000');
      expect(result.cpm_currency).toBe('XAF');
      expect(result.cpm_customer_phone).toBe('670001122');
      expect(result.description).toBeDefined();
    });

    it('sanitizes Paystack webhook payload with customer details preserved', async () => {
      const paystackPayload = {
        event: 'charge.success',
        data: {
          id: 300122,
          domain: 'live',
          status: 'success',
          reference: 'pstk_ref_9921',
          amount: 500000,
          message: 'Paiement réussi',
          customer: {
            id: 8812,
            phone: '+237699112233',
            email: 'client@example.com',
          },
        },
      };

      const result = sanitizeAggregatorPayload(paystackPayload, 'ewo-CM');

      expect(result.data.reference).toBe('pstk_ref_9921');
      expect(result.data.amount).toBe(500000);
      expect(result.data.customer.phone).toBe('+237699112233');
    });
  });

  describe('HTTP Framework Middlewares (Express, Fastify, Next.js)', () => {
    it('express middleware intercepts res.json and sets X-LinguaBridge-Verified header', async () => {
      const middleware = linguaBridgeExpress({ targetLang: 'ewo-CM' });

      let interceptedBody: any;
      const headersSent: Record<string, string> = {};

      const req: any = { headers: {} };
      const res: any = {
        setHeader(name: string, val: string) {
          headersSent[name] = val;
        },
        json(data: any) {
          interceptedBody = data;
          return this;
        },
        send(data: any) {
          interceptedBody = data;
          return this;
        },
      };

      let nextCalled = false;
      middleware(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);

      // Trigger response
      await res.json({
        message: 'Solde disponible',
        amount: 25000,
        currency: 'FCFA',
      });

      expect(headersSent['X-LinguaBridge-Verified']).toBe('true');
      expect(interceptedBody.amount).toBe(25000);
      expect(interceptedBody.currency).toBe('FCFA');
    });

    it('wraps Next.js API route handler transparently with withLinguaBridge', async () => {
      const handler = async (_req: any, res: any) => {
        return res.status(200).json({
          status: 'ok',
          message: 'Transfert effectué',
          amount: 10000,
        });
      };

      const wrappedHandler = withLinguaBridge(handler, { targetLang: 'ewo-CM' });
      const headers: Record<string, string> = {};
      let jsonOutput: any;

      const mockRes: any = {
        status(code: number) {
          this.statusCode = code;
          return this;
        },
        setHeader(name: string, val: string) {
          headers[name] = val;
        },
        json(data: any) {
          jsonOutput = data;
          return this;
        },
      };

      await wrappedHandler({ headers: {} } as any, mockRes);

      expect(mockRes.statusCode).toBe(200);
      expect(headers['X-LinguaBridge-Verified']).toBe('true');
      expect(jsonOutput.amount).toBe(10000);
    });
  });
});
