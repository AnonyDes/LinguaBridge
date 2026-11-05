import { randomUUID } from 'node:crypto';

export interface ApiKeyRecord {
  id: string;
  name: string;
  key?: string; // Only present when newly provisioned
  prefix: string;
  permissions: string[];
  quota: {
    requestsPerMinute?: number;
    requestsPerDay?: number;
  };
  isActive: boolean;
  createdAt: string;
  revokedAt?: string | null;
  lastUsedAt?: string | null;
  tenantId?: string;
}

export interface CreateKeyInput {
  name: string;
  permissions?: string[];
  quota?: {
    requestsPerMinute?: number;
    requestsPerDay?: number;
  } | number;
  tenantId?: string;
}

export interface KeyValidationResult {
  valid: boolean;
  key?: ApiKeyRecord;
  reason?: 'revoked' | 'invalid' | 'expired';
}

export class ApiKeyService {
  private keysById: Map<string, ApiKeyRecord> = new Map();
  private keysByRawToken: Map<string, string> = new Map(); // rawKey -> id

  constructor() {
    this.seedDefaultKeys();
  }

  private seedDefaultKeys(): void {
    // 1. Official demo key (pre-authorized for test & sandbox suites)
    const demoId = 'demo-api-key-default';
    const demoRawKey = 'lb_demo_key_2026';
    const demoRecord: ApiKeyRecord = {
      id: demoId,
      name: 'LinguaBridge Official Demo Key',
      prefix: 'lb_demo_2026',
      permissions: ['*'],
      quota: {
        requestsPerMinute: 1000,
        requestsPerDay: 50000,
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      revokedAt: null,
      lastUsedAt: null,
      tenantId: 'tenant-demo-sovereign',
    };
    this.keysById.set(demoId, demoRecord);
    this.keysByRawToken.set(demoRawKey, demoId);

    // 2. Environment API Key if configured
    if (process.env.API_KEY && process.env.API_KEY !== demoRawKey) {
      const envRawKey = process.env.API_KEY.trim();
      const envId = 'env-api-key-prod';
      const envRecord: ApiKeyRecord = {
        id: envId,
        name: 'Environment Production Key',
        prefix: envRawKey.slice(0, 10),
        permissions: ['*'],
        quota: {
          requestsPerMinute: 5000,
          requestsPerDay: 500000,
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        revokedAt: null,
        lastUsedAt: null,
      };
      this.keysById.set(envId, envRecord);
      this.keysByRawToken.set(envRawKey, envId);
    }
  }

  /**
   * Provision a brand-new API key with cryptographic prefix, permissions, and quota.
   */
  createKey(input: CreateKeyInput): ApiKeyRecord {
    const id = randomUUID();
    const rawKey = `lb_live_${randomUUID().replace(/-/g, '')}`;
    const prefix = rawKey.slice(0, 12);

    let quota: { requestsPerMinute?: number; requestsPerDay?: number } = {
      requestsPerMinute: 60,
      requestsPerDay: 5000,
    };

    if (typeof input.quota === 'number') {
      quota = { requestsPerDay: input.quota };
    } else if (input.quota && typeof input.quota === 'object') {
      quota = {
        requestsPerMinute: input.quota.requestsPerMinute ?? 60,
        requestsPerDay: input.quota.requestsPerDay ?? 5000,
      };
    }

    const record: ApiKeyRecord = {
      id,
      name: input.name.trim(),
      prefix,
      permissions: input.permissions && input.permissions.length > 0 ? input.permissions : ['translate:read'],
      quota,
      isActive: true,
      createdAt: new Date().toISOString(),
      revokedAt: null,
      lastUsedAt: null,
      tenantId: input.tenantId,
    };

    this.keysById.set(id, record);
    this.keysByRawToken.set(rawKey, id);

    // Return representation including rawKey on creation ONLY
    return {
      ...record,
      key: rawKey,
    };
  }

  /**
   * List all provisioned keys (active and revoked) without exposing raw secret tokens.
   */
  listKeys(): Omit<ApiKeyRecord, 'key'>[] {
    return Array.from(this.keysById.values()).map((record) => {
      const { key: _unused, ...safeRecord } = record as any;
      return safeRecord;
    });
  }

  /**
   * Retrieve single key by ID (public developer metadata).
   */
  getKey(id: string): Omit<ApiKeyRecord, 'key'> | undefined {
    const record = this.keysById.get(id);
    if (!record) return undefined;
    const { key: _unused, ...safeRecord } = record as any;
    return safeRecord;
  }

  /**
   * Instant revocation of an API key.
   * Returns updated key record or null if not found.
   */
  revokeKey(id: string): Omit<ApiKeyRecord, 'key'> | null {
    const record = this.keysById.get(id);
    if (!record) return null;

    record.isActive = false;
    record.revokedAt = new Date().toISOString();

    const { key: _unused, ...safeRecord } = record as any;
    return safeRecord;
  }

  /**
   * Fast validation of an incoming API key token.
   * Immediately rejects unknown or revoked keys.
   */
  validateKey(rawKey: string): KeyValidationResult {
    if (!rawKey || typeof rawKey !== 'string') {
      return { valid: false, reason: 'invalid' };
    }

    const clean = rawKey.trim();
    const id = this.keysByRawToken.get(clean);

    if (!id) {
      // Check legacy demo keys fallback
      if (clean === 'lb_demo_key_2026') {
        const demoRecord = this.keysById.get('demo-api-key-default');
        if (demoRecord && demoRecord.isActive) {
          demoRecord.lastUsedAt = new Date().toISOString();
          return { valid: true, key: demoRecord };
        }
      }
      return { valid: false, reason: 'invalid' };
    }

    const record = this.keysById.get(id);
    if (!record) {
      return { valid: false, reason: 'invalid' };
    }

    if (!record.isActive) {
      return { valid: false, key: record, reason: 'revoked' };
    }

    record.lastUsedAt = new Date().toISOString();
    return { valid: true, key: record };
  }

  getActiveCount(): number {
    let count = 0;
    for (const k of this.keysById.values()) {
      if (k.isActive) count++;
    }
    return count;
  }

  getRevokedCount(): number {
    let count = 0;
    for (const k of this.keysById.values()) {
      if (!k.isActive) count++;
    }
    return count;
  }
}

export const apiKeyService = new ApiKeyService();
