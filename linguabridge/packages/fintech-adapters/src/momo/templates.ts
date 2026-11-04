import { FinancialEntityExtractor } from '@linguabridge/financial-domain';
import { translateSentenceToEwondo } from '@linguabridge/translation-engine';
import { ZeroDriftViolationError } from '../errors';
import type { LocalizeMomoOptions, MomoNotification } from '../types';
import { parseMomoSms } from './parser';

const extractor = new FinancialEntityExtractor();

/**
 * Generates a localized MTN MoMo notification string in a sovereign African language (e.g. Ewondo)
 * with strict zero-drift guarantee on all financial amounts, fees, balances, phones, and transaction IDs.
 */
export function localizeMomoNotification(
  notificationOrRaw: MomoNotification | string,
  targetLang = 'ewo-CM',
  options?: LocalizeMomoOptions
): string {
  const notification: MomoNotification = typeof notificationOrRaw === 'string'
    ? parseMomoSms(notificationOrRaw)
    : notificationOrRaw;

  const rawText = notification.raw || '';
  const strict = options?.strict ?? true;

  let localized: string;

  if (options?.customTemplate) {
    let tpl = options.customTemplate;
    if (notification.amount) tpl = tpl.replace('{amount}', notification.amount);
    if (notification.fee) tpl = tpl.replace('{fee}', notification.fee);
    if (notification.balance) tpl = tpl.replace('{balance}', notification.balance);
    if (notification.sender) tpl = tpl.replace('{sender}', notification.sender);
    if (notification.recipient) tpl = tpl.replace('{recipient}', notification.recipient);
    if (notification.transactionId) tpl = tpl.replace('{transactionId}', notification.transactionId);
    if (notification.date) tpl = tpl.replace('{date}', notification.date);
    localized = tpl;
  } else if (targetLang.startsWith('ewo')) {
    // Official Ewondo NACALCO-certified templates
    switch (notification.type) {
      case 'received': {
        const parts: string[] = [];
        parts.push(`O wó'ó ${notification.amount || ''}`);
        if (notification.sender) {
          parts.push(`de ${notification.sender}`);
        }
        if (notification.date) {
          parts.push(`le ${notification.date}.`);
        } else {
          parts[parts.length - 1] += '.';
        }
        if (notification.fee) {
          parts.push(`Móni mfá: ${notification.fee}.`);
        }
        if (notification.balance) {
          parts.push(`Móni mí ne wá é bẽng: ${notification.balance}.`);
        }
        if (notification.transactionId) {
          parts.push(`ID Transaction: ${notification.transactionId}.`);
        }
        localized = parts.join(' ');
        break;
      }

      case 'sent': {
        const parts: string[] = [];
        parts.push(`Lóm móni ${notification.amount || ''}`);
        if (notification.recipient) {
          parts.push(`a ${notification.recipient}`);
        }
        parts.push(`l'ayáa dúa.`);
        if (notification.fee) {
          parts.push(`Móni mfá: ${notification.fee}.`);
        }
        if (notification.balance) {
          parts.push(`Móni mí ne wá é bẽng: ${notification.balance}.`);
        }
        if (notification.transactionId) {
          parts.push(`ID Transaction: ${notification.transactionId}.`);
        }
        localized = parts.join(' ');
        break;
      }

      case 'cash_out': {
        const parts: string[] = [];
        parts.push(`Kób móni ${notification.amount || ''} l'ayáa dúa.`);
        if (notification.recipient) {
          parts.push(`Agent: ${notification.recipient}.`);
        }
        if (notification.fee) {
          parts.push(`Móni mfá: ${notification.fee}.`);
        }
        if (notification.balance) {
          parts.push(`Móni mí ne wá é bẽng: ${notification.balance}.`);
        }
        if (notification.transactionId) {
          parts.push(`ID Transaction: ${notification.transactionId}.`);
        }
        localized = parts.join(' ');
        break;
      }

      case 'payment': {
        const parts: string[] = [];
        parts.push(`Tóbó móni ${notification.amount || ''}`);
        if (notification.recipient) {
          parts.push(`a ${notification.recipient}`);
        }
        parts.push(`l'ayáa dúa.`);
        if (notification.fee) {
          parts.push(`Móni mfá: ${notification.fee}.`);
        }
        if (notification.balance) {
          parts.push(`Móni mí ne wá é bẽng: ${notification.balance}.`);
        }
        if (notification.transactionId) {
          parts.push(`ID Transaction: ${notification.transactionId}.`);
        }
        localized = parts.join(' ');
        break;
      }

      case 'balance': {
        const parts: string[] = [];
        parts.push(`Móni mí ne wá é bẽng: ${notification.balance || notification.amount || ''}.`);
        if (notification.transactionId) {
          parts.push(`ID Transaction: ${notification.transactionId}.`);
        }
        localized = parts.join(' ');
        break;
      }

      case 'ussd_prompt': {
        const parts: string[] = [];
        parts.push(`Dúa lóm móni ${notification.amount || ''}`);
        if (notification.recipient) {
          parts.push(`a ${notification.recipient}`);
        }
        if (notification.fee) {
          parts.push(`(Móni mfá: ${notification.fee})`);
        }
        parts.push(`? Kɔ́b 1 asu ya dúa, 2 asu ya tege dúa.`);
        localized = parts.join(' ');
        break;
      }

      default: {
        // Fallback to sentence translator
        localized = translateSentenceToEwondo(rawText || '');
        break;
      }
    }
  } else {
    // For other language targets or generic translation
    localized = translateSentenceToEwondo(rawText || '');
  }

  // --- Strict Zero-Drift AST Verification ---
  const sourceEntities = extractor.extract(rawText || '');
  const localizedEntities = extractor.extract(localized);
  const guard = extractor.compare(sourceEntities, localizedEntities);

  if (!guard.safe) {
    if (strict) {
      const violationDetails = guard.violations.map((v) => v.issue).join('; ');
      throw new ZeroDriftViolationError(
        `Zero-drift violation in MoMo template: ${violationDetails}`,
        guard
      );
    }
    // Non-strict fallback to original raw message
    return rawText;
  }

  return localized;
}

/**
 * Alias for localizeMomoNotification.
 */
export const generateMomoTemplate = localizeMomoNotification;
