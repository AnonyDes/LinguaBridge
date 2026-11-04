import { FinancialEntityExtractor } from '@linguabridge/financial-domain';
import { UnrecognizedNotificationError } from '../errors';
import type { MomoNotification, MomoNotificationType } from '../types';

const extractor = new FinancialEntityExtractor();

/**
 * Parses raw MTN MoMo SMS notifications into structured fields.
 */
export function parseMomoSms(raw: string): MomoNotification {
  if (!raw || !raw.trim()) {
    throw new UnrecognizedNotificationError('Empty SMS notification cannot be parsed', raw);
  }

  const text = raw.trim();
  const entities = extractor.extract(text);

  // Classify notification type
  let type: MomoNotificationType = 'unknown';
  const lower = text.toLowerCase();

  if (/(?:re[cç]u|received|credit|crédité|crédit)/i.test(lower)) {
    type = 'received';
  } else if (/(?:transfert|transfer|envoy[eé]|sent)/i.test(lower)) {
    type = 'sent';
  } else if (/(?:retrait|cash\s*out|cashout|withdrawn)/i.test(lower)) {
    type = 'cash_out';
  } else if (/(?:paiement|payment|achat|paid)/i.test(lower)) {
    type = 'payment';
  } else if (/(?:solde|balance)/i.test(lower)) {
    type = 'balance';
  }

  // Extract financial entities
  const amountEntities = entities.filter((e) => e.type === 'amount');
  const phoneEntities = entities.filter((e) => e.type === 'phone');
  const txnEntities = entities.filter((e) => e.type === 'transaction_id');
  const dateEntities = entities.filter((e) => e.type === 'date');

  let amount: string | undefined;
  let currency: string | undefined;
  let fee: string | undefined;
  let balance: string | undefined;

  // Extract explicit fee if present
  const feeMatch = text.match(/(?:frais|fee|fees)\s*[:=]?\s*(\d[\d\s,\.]*(?:\s*(?:FCFA|XAF|CFA|EUR|USD|FRS|F))?)/i);
  if (feeMatch) {
    const rawFee = feeMatch[1].trim();
    const feeEntity = amountEntities.find((e) => e.raw.includes(rawFee) || rawFee.includes(e.raw));
    fee = feeEntity ? feeEntity.raw : rawFee;
  }

  // Extract explicit balance if present
  const balanceMatch = text.match(/(?:nouveau solde|new balance|solde actuel|solde disponible|solde)\s*[:=]?\s*(\d[\d\s,\.]*(?:\s*(?:FCFA|XAF|CFA|EUR|USD|FRS|F))?)/i);
  if (balanceMatch) {
    const rawBal = balanceMatch[1].trim();
    const balEntity = amountEntities.find((e) => e.raw.includes(rawBal) || rawBal.includes(e.raw));
    balance = balEntity ? balEntity.raw : rawBal;
  }

  // Determine main transfer/payment amount (distinct from fee and balance)
  const currencyAmounts = amountEntities.filter((e) => /FCFA|XAF|CFA|EUR|USD|FRS|F/i.test(e.raw));
  const candidates = currencyAmounts.length > 0 ? currencyAmounts : amountEntities;
  for (const ent of candidates) {
    if (fee && (ent.raw === fee || fee.includes(ent.raw))) continue;
    if (balance && (ent.raw === balance || balance.includes(ent.raw))) continue;
    amount = ent.raw;
    const parts = ent.normalized.split('_');
    currency = parts[1] || 'FCFA';
    break;
  }

  // If no primary amount was separated, but amounts exist
  if (!amount && amountEntities.length > 0) {
    amount = amountEntities[0].raw;
    const parts = amountEntities[0].normalized.split('_');
    currency = parts[1] || 'FCFA';
  }

  // If currency was not found yet, default to FCFA for CEMAC/MoMo
  if (!currency && amount) {
    const currMatch = amount.match(/[A-Z]{3,4}/i);
    currency = currMatch ? currMatch[0].toUpperCase() : 'FCFA';
  }

  // Extract sender and recipient
  let sender: string | undefined;
  let recipient: string | undefined;

  const fromMatch = text.match(/(?:de|from)\s+([+\d][\d\s\-]{7,15}|[A-Za-z0-9\s_]{3,25})(?=[.,\s]|$)/i);
  if (fromMatch) {
    sender = fromMatch[1].trim();
  }

  const toMatch = text.match(/(?:[aà]|to|vers)\s+(?:le\s+|la\s+)?([+\d][\d\s\-]{7,18})(?=[.,\s]|$)/i);
  if (toMatch) {
    recipient = toMatch[1].trim();
  }

  // Cross-reference with detected phone entities
  if (phoneEntities.length > 0) {
    if (type === 'received' && !sender) {
      sender = phoneEntities[0].raw;
    } else if ((type === 'sent' || type === 'payment') && !recipient) {
      recipient = phoneEntities[0].raw;
    }
  }

  // Extract transaction ID
  let transactionId: string | undefined;
  if (txnEntities.length > 0) {
    transactionId = txnEntities[0].raw;
  } else {
    const txnMatch = text.match(/(?:ID(?:\s*Transaction)?|Ref(?:erence)?|Txn(?:\s*ID)?|Trans\s*ID)\s*[:=]?\s*([A-Za-z0-9\-_]{5,30})/i);
    if (txnMatch) {
      transactionId = txnMatch[1].trim();
    }
  }

  // Extract date
  let date: string | undefined;
  if (dateEntities.length > 0) {
    date = dateEntities[0].raw;
  } else {
    const dateMatch = text.match(/(?:le|on|date)\s*[:=]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}-\d{2}-\d{2})/i);
    if (dateMatch) {
      date = dateMatch[1].trim();
    }
  }

  // Ensure message has meaningful content
  if (!amount && !balance && !transactionId && phoneEntities.length === 0) {
    throw new UnrecognizedNotificationError('Could not recognize any valid MTN MoMo financial entities in SMS', text);
  }

  return {
    type,
    amount,
    currency,
    sender,
    recipient,
    fee,
    balance,
    transactionId,
    date,
    raw: text,
  };
}

/**
 * Parses raw MTN MoMo USSD session prompts and responses.
 */
export function parseMomoUssd(raw: string): MomoNotification {
  if (!raw || !raw.trim()) {
    throw new UnrecognizedNotificationError('Empty USSD notification cannot be parsed', raw);
  }

  const text = raw.trim();
  const entities = extractor.extract(text);

  let type: MomoNotificationType = 'ussd_prompt';
  const lower = text.toLowerCase();

  if (/(?:solde|balance)/i.test(lower) && !/(?:confirmez|confirm|entrez|enter|composer)/i.test(lower)) {
    type = 'balance';
  } else if (/(?:confirmez|confirm|voulez-vous|do you want)/i.test(lower)) {
    type = 'ussd_prompt';
  }

  const amountEntities = entities.filter((e) => e.type === 'amount');
  const phoneEntities = entities.filter((e) => e.type === 'phone');
  const txnEntities = entities.filter((e) => e.type === 'transaction_id');

  let amount: string | undefined;
  let currency: string | undefined;
  let fee: string | undefined;
  let balance: string | undefined;

  const feeMatch = text.match(/(?:frais|fee|fees)\s*(?:de)?\s*[:=]?\s*(\d[\d\s,\.]*(?:\s*(?:FCFA|XAF|CFA|EUR|USD|FRS|F))?)/i);
  if (feeMatch) {
    fee = feeMatch[1].trim();
  }

  if (type === 'balance') {
    if (amountEntities.length > 0) {
      balance = amountEntities[0].raw;
      amount = balance;
      const parts = amountEntities[0].normalized.split('_');
      currency = parts[1] || 'FCFA';
    }
  } else {
    for (const ent of amountEntities) {
      if (fee && (ent.raw === fee || fee.includes(ent.raw))) continue;
      amount = ent.raw;
      const parts = ent.normalized.split('_');
      currency = parts[1] || 'FCFA';
      break;
    }
  }

  let recipient: string | undefined;
  const toMatch = text.match(/(?:[aà]|to|vers)\s+([+\d][\d\s\-]{7,15})/i);
  if (toMatch) {
    recipient = toMatch[1].trim();
  } else if (phoneEntities.length > 0) {
    recipient = phoneEntities[0].raw;
  }

  const transactionId = txnEntities.length > 0 ? txnEntities[0].raw : undefined;

  return {
    type,
    amount,
    currency: currency || 'FCFA',
    recipient,
    fee,
    balance,
    transactionId,
    raw: text,
  };
}
