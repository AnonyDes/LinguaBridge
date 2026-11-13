import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Validates Orange Money webhook HMAC-SHA256 signatures with timing-safe comparison.
 *
 * @param payload The exact request body as bytes or a UTF-8 string
 * @param signature The signature from the X-Orange-Signature or Authorization header
 * @param secret The shared webhook secret / signing key
 */
export function validateOrangeMoneySignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  // Clean provided signature
  const cleanSignature = signature.trim().replace(/^sha256=/i, '');
  if (!/^[a-f0-9]{64}$/i.test(cleanSignature)) return false;

  // Compute expected HMAC-SHA256 hex digest
  const hmac = createHmac('sha256', secret);
  hmac.update(typeof payload === 'string' ? Buffer.from(payload, 'utf8') : payload);
  const expectedSignature = hmac.digest('hex');

  // Convert to buffers for timing-safe comparison
  const expectedBuf = Buffer.from(expectedSignature, 'hex');
  const providedBuf = Buffer.from(cleanSignature, 'hex');

  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }

  return timingSafeEqual(expectedBuf, providedBuf);
}
