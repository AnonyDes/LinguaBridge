import { randomUUID } from 'node:crypto';
import type { ApiKeyService } from './api-key-service';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  apiKey?: string;
  keyId?: string;
  method: string;
  route: string;
  statusCode: number;
  latencyMs: number;
  sourceLang?: string;
  targetLang?: string;
  protectedEntities?: Array<{ type: string; normalized: string }>;
  driftDetected: boolean;
  ip?: string;
  userAgent?: string;
}

export interface AuditLogFilter {
  limit?: number;
  offset?: number;
  route?: string;
  statusCode?: number;
  keyId?: string;
  driftOnly?: boolean;
  sourceLang?: string;
  targetLang?: string;
}

export interface DashboardStats {
  totalRequests: number;
  languageDistribution: Record<string, number>;
  activeKeys: number;
  revokedKeys: number;
  averageLatencyMs: number;
  driftAlerts: number;
  uptimeSeconds: number;
  systemStatus: 'healthy' | 'degraded';
  timestamp: string;
}

export class AuditLoggerService {
  private entries: AuditLogEntry[] = [];
  private maxCapacity = 5000;

  constructor(maxCapacity = 5000) {
    this.maxCapacity = maxCapacity;
  }

  /**
   * Record an immutable audit log entry.
   */
  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const record: AuditLogEntry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.entries.push(record);
    if (this.entries.length > this.maxCapacity) {
      this.entries.shift(); // maintain ring buffer
    }

    return record;
  }

  /**
   * Filter and paginate developer audit logs.
   */
  getLogs(filter: AuditLogFilter = {}): {
    logs: AuditLogEntry[];
    total: number;
    count: number;
    limit: number;
    offset: number;
  } {
    let filtered = [...this.entries];

    if (filter.route) {
      filtered = filtered.filter((e) => e.route.toLowerCase().includes(filter.route!.toLowerCase()));
    }
    if (filter.statusCode !== undefined) {
      filtered = filtered.filter((e) => e.statusCode === filter.statusCode);
    }
    if (filter.keyId) {
      filtered = filtered.filter((e) => e.keyId === filter.keyId);
    }
    if (filter.driftOnly === true) {
      filtered = filtered.filter((e) => e.driftDetected);
    }
    if (filter.sourceLang) {
      filtered = filtered.filter((e) => e.sourceLang === filter.sourceLang);
    }
    if (filter.targetLang) {
      filtered = filtered.filter((e) => e.targetLang === filter.targetLang);
    }

    // Newest logs first
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = filtered.length;
    const offset = Math.max(0, filter.offset || 0);
    const limit = Math.max(1, Math.min(filter.limit || 50, 200));
    const page = filtered.slice(offset, offset + limit);

    return {
      logs: page,
      total,
      count: page.length,
      limit,
      offset,
    };
  }

  /**
   * Calculate live real-time developer metrics for dashboard.
   */
  getStats(apiKeyService: ApiKeyService): DashboardStats {
    const totalRequests = this.entries.length;

    // Sovereign 5 languages distribution initialized
    const languageDistribution: Record<string, number> = {
      'ewo-CM': 0,
      'fuv-CM': 0,
      'hau-CM': 0,
      'knc-CM': 0,
      'pcm-CM': 0,
      'fr': 0,
      'en': 0,
    };

    let totalLatency = 0;
    let driftAlerts = 0;

    for (const e of this.entries) {
      totalLatency += e.latencyMs;
      if (e.driftDetected) {
        driftAlerts++;
      }
      if (e.targetLang) {
        languageDistribution[e.targetLang] = (languageDistribution[e.targetLang] || 0) + 1;
      }
    }

    const averageLatencyMs = totalRequests > 0 ? Number((totalLatency / totalRequests).toFixed(2)) : 0;

    return {
      totalRequests,
      languageDistribution,
      activeKeys: apiKeyService.getActiveCount(),
      revokedKeys: apiKeyService.getRevokedCount(),
      averageLatencyMs,
      driftAlerts,
      uptimeSeconds: Math.floor(process.uptime()),
      systemStatus: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  clear(): void {
    this.entries = [];
  }
}

export const auditLogger = new AuditLoggerService();
