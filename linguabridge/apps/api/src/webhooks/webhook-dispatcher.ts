import crypto from 'node:crypto';
import { randomUUID as uuidv4 } from 'node:crypto';
import type {
  WebhookPayload,
  WebhookEventType,
  WebhookDispatchOptions,
  WebhookDispatchResult,
  BatchCompletedWebhookData,
  BatchFailedWebhookData,
  FinancialDriftWebhookData,
} from './webhook-types';

export const DEFAULT_WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

/**
 * Computes an HMAC SHA-256 hex digest for a raw webhook payload string.
 */
export function createWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Validates an incoming webhook signature using timing-safe comparison.
 * Supports headers formatted as "sha256=<hex>" or raw "<hex>".
 */
export function verifyWebhookSignature(
  rawPayload: string | Buffer,
  signatureHeader: string,
  secret: string
): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  const expectedSignature = createWebhookSignature(
    typeof rawPayload === 'string' ? rawPayload : rawPayload.toString('utf8'),
    secret
  );

  const cleanHeader = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice(7).trim()
    : signatureHeader.trim();

  if (expectedSignature.length !== cleanHeader.length) {
    return false;
  }

  try {
    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    const headerBuf = Buffer.from(cleanHeader, 'hex');
    return crypto.timingSafeEqual(expectedBuf, headerBuf);
  } catch {
    return false;
  }
}

export class WebhookDispatcher {
  private defaultSecret?: string;

  constructor(defaultSecret = DEFAULT_WEBHOOK_SECRET) {
    this.defaultSecret = defaultSecret;
  }

  /**
   * Dispatches a webhook notification with HMAC SHA-256 signature and retry support.
   */
  async dispatch(options: WebhookDispatchOptions): Promise<WebhookDispatchResult> {
    const {
      url,
      event,
      data,
      secret = this.defaultSecret ?? process.env.WEBHOOK_SECRET,
      maxRetries = 3,
      initialDelayMs = 100,
      timeoutMs = 5000,
    } = options;

    const eventId = uuidv4();
    if (!secret?.trim() || !url.startsWith('https://')) {
      return {
        success: false,
        attempts: 0,
        error: 'HTTPS destination and signing secret required',
        payload: { id: eventId, event, timestamp: new Date().toISOString(), attempt: 0, data },
      };
    }
    let attempt = 0;
    let lastError: string | undefined;
    let statusCode: number | undefined;

    while (attempt <= maxRetries) {
      attempt++;
      const payload: WebhookPayload<unknown> = {
        id: eventId,
        event,
        timestamp: new Date().toISOString(),
        attempt,
        data,
      };

      const payloadString = JSON.stringify(payload);
      const signatureHex = createWebhookSignature(payloadString, secret);
      const signatureHeader = `sha256=${signatureHex}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-LinguaBridge-Event': event,
            'X-LinguaBridge-Delivery': eventId,
            'X-LinguaBridge-Signature': signatureHeader,
            'User-Agent': 'LinguaBridge-Webhook-Dispatcher/1.0',
          },
          body: payloadString,
          redirect: 'error',
          signal: AbortSignal.timeout(timeoutMs),
        });

        statusCode = response.status;
        await response.body?.cancel();

        if (response.ok) {
          return {
            success: true,
            statusCode,
            attempts: attempt,
            payload,
          };
        }

        lastError = `HTTP ${response.status}: ${response.statusText}`;
      } catch (err) {
        lastError = (err as Error).message;
      }

      // If we haven't exhausted retries, wait with exponential backoff
      if (attempt <= maxRetries) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      statusCode,
      attempts: attempt,
      error: lastError,
      payload: {
        id: eventId,
        event,
        timestamp: new Date().toISOString(),
        attempt,
        data,
      },
    };
  }

  /**
   * Convenience dispatcher for batch completion
   */
  async dispatchBatchCompleted(
    url: string,
    data: BatchCompletedWebhookData,
    secret?: string
  ): Promise<WebhookDispatchResult> {
    return this.dispatch({
      url,
      event: 'translation.batch.completed',
      data,
      secret,
    });
  }

  /**
   * Convenience dispatcher for batch failure
   */
  async dispatchBatchFailed(
    url: string,
    data: BatchFailedWebhookData,
    secret?: string
  ): Promise<WebhookDispatchResult> {
    return this.dispatch({
      url,
      event: 'translation.batch.failed',
      data,
      secret,
    });
  }

  /**
   * Convenience dispatcher for financial drift / entity tampering detected
   */
  async dispatchFinancialDrift(
    url: string,
    data: FinancialDriftWebhookData,
    secret?: string
  ): Promise<WebhookDispatchResult> {
    return this.dispatch({
      url,
      event: 'audit.financial_drift_detected',
      data,
      secret,
    });
  }
}

export const webhookDispatcher = new WebhookDispatcher();
