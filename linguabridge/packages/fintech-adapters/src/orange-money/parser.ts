import { InvalidOrangeMoneyPayloadError } from '../errors';
import type { OrangeMoneyWebhookEvent } from '../types';

/**
 * Parses and validates an Orange Money webhook payload.
 * Supports snake_case, camelCase, and nested payload variants from Orange Money APIs.
 */
export function parseOrangeMoneyWebhook(
  body: string | Record<string, unknown>
): OrangeMoneyWebhookEvent {
  if (!body) {
    throw new InvalidOrangeMoneyPayloadError('Orange Money payload cannot be empty');
  }

  let payload: Record<string, unknown>;

  if (typeof body === 'string') {
    try {
      payload = JSON.parse(body);
    } catch {
      throw new InvalidOrangeMoneyPayloadError('Orange Money payload must be valid JSON');
    }
  } else {
    payload = body;
  }

  // Handle nested 'data' envelope if present
  const data = (payload.data && typeof payload.data === 'object')
    ? (payload.data as Record<string, unknown>)
    : payload;

  const event = String(payload.event || data.event || data.type || 'payment.success');

  const orderId = String(
    data.order_id ??
    data.orderId ??
    data.orderID ??
    payload.order_id ??
    payload.orderId ??
    data.notif_token ??
    ''
  ).trim();

  const transactionId = String(
    data.txn_id ??
    data.txnid ??
    data.transaction_id ??
    data.transactionId ??
    data.pay_token ??
    payload.txn_id ??
    payload.transaction_id ??
    ''
  ).trim();

  const customerPhone = String(
    data.customer_phone ??
    data.customerPhone ??
    data.client_msisdn ??
    data.msisdn ??
    data.subscriber_msisdn ??
    data.phone ??
    payload.client_msisdn ??
    payload.customer_phone ??
    payload.msisdn ??
    ''
  ).trim();

  const rawAmount = data.amount ?? payload.amount;
  if (rawAmount === undefined || rawAmount === null || rawAmount === '') {
    throw new InvalidOrangeMoneyPayloadError('Missing required field: amount', 'amount');
  }

  if (!customerPhone) {
    throw new InvalidOrangeMoneyPayloadError('Missing required field: customer_phone', 'customer_phone');
  }

  if (!transactionId && !orderId) {
    throw new InvalidOrangeMoneyPayloadError('Missing transaction reference (txn_id or order_id)', 'txn_id');
  }

  const currency = String(
    data.currency ??
    payload.currency ??
    'FCFA'
  ).toUpperCase();

  const fee = data.fee ?? payload.fee ?? data.charges ?? 0;

  const rawStatus = String(
    data.status ??
    payload.status ??
    'SUCCESS'
  ).toUpperCase();

  const status = rawStatus === 'SUCCESS' || rawStatus === 'SUCCESSFUL' || rawStatus === 'COMPLETED'
    ? 'SUCCESS'
    : rawStatus === 'FAILED' || rawStatus === 'CANCELLED' || rawStatus === 'EXPIRED'
    ? 'FAILED'
    : rawStatus;

  const timestamp = String(
    data.timestamp ??
    data.created_at ??
    payload.timestamp ??
    new Date().toISOString()
  );

  const merchantId = data.merchant_id
    ? String(data.merchant_id)
    : payload.merchant_id
    ? String(payload.merchant_id)
    : undefined;

  return {
    event,
    orderId: orderId || transactionId,
    amount: typeof rawAmount === 'number' ? rawAmount : String(rawAmount).trim(),
    currency,
    customerPhone,
    transactionId: transactionId || orderId,
    fee: typeof fee === 'number' ? fee : String(fee).trim(),
    status,
    timestamp,
    merchantId,
    metadata: (data.metadata || payload.metadata || {}) as Record<string, unknown>,
    rawPayload: body,
  };
}
