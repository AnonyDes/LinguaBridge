import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Validates Orange Money webhook HMAC-SHA256 signatures with timing-safe comparison.
 *
 * @param payload The raw request body string or parsed JSON object
 * @param signature The signature from the X-Orange-Signature or Authorization header
 * @param secret The shared webhook secret / signing key
 */
export function validateOrangeMoneySignature(
  payload: string | Record<string, unknown>,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  // Canonical string representation
  let raw: string;
  if (typeof payload === 'string') {
    raw = payload;
  } else {
    // Deterministic string serialization
    raw = JSON.stringify(payload);
  }

  // Clean provided signature
  const cleanSignature = signature.trim().replace(/^sha256=/i, '');

  // Compute expected HMAC-SHA256 hex digest
  const hmac = createHmac('sha256', secret);
  hmac.update(raw, 'utf8');
  const expectedSignature = hmac.digest('hex');

  // Convert to buffers for timing-safe comparison
  const expectedBuf = Buffer.from(expectedSignature, 'hex');
  const providedBuf = Buffer.from(cleanSignature, 'hex');

  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }

  return timingSafeEqual(expectedBuf, providedBuf);
}
