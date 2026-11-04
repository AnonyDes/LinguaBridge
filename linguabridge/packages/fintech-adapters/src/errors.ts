import type { FinancialGuardResult } from '@linguabridge/shared-types';

export class ZeroDriftViolationError extends Error {
  public readonly guardResult?: FinancialGuardResult;

  constructor(message: string, guardResult?: FinancialGuardResult) {
    super(message);
    this.name = 'ZeroDriftViolationError';
    this.guardResult = guardResult;
    Object.setPrototypeOf(this, ZeroDriftViolationError.prototype);
  }
}

export class InvalidOrangeMoneyPayloadError extends Error {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'InvalidOrangeMoneyPayloadError';
    this.field = field;
    Object.setPrototypeOf(this, InvalidOrangeMoneyPayloadError.prototype);
  }
}

export class UnauthorizedWebhookError extends Error {
  constructor(message = 'Unauthorized webhook signature or token') {
    super(message);
    this.name = 'UnauthorizedWebhookError';
    Object.setPrototypeOf(this, UnauthorizedWebhookError.prototype);
  }
}

export class FinancialDriftException extends Error {
  public readonly violations?: unknown[];

  constructor(message: string, violations?: unknown[]) {
    super(message);
    this.name = 'FinancialDriftException';
    this.violations = violations;
    Object.setPrototypeOf(this, FinancialDriftException.prototype);
  }
}

export class UnrecognizedNotificationError extends Error {
  public readonly rawText?: string;

  constructor(message: string, rawText?: string) {
    super(message);
    this.name = 'UnrecognizedNotificationError';
    this.rawText = rawText;
    Object.setPrototypeOf(this, UnrecognizedNotificationError.prototype);
  }
}
