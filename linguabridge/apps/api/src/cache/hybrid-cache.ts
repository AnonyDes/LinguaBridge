import type { CacheStore } from '@linguabridge/translation-engine';
import postgres from 'postgres';

export class HybridCacheStore implements CacheStore {
  private memoryStore: Map<string, { value: string; expiresAt?: number }> = new Map();
  private sql: ReturnType<typeof postgres> | null = null;
  private dbHealthy = false;

  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        this.sql = postgres(dbUrl, {
          max: 5,
          idle_timeout: 20,
          connect_timeout: 5,
          onnotice: () => {}, // suppress notices
        });
        this.checkDatabaseConnection();
      } catch (err) {
        console.warn('[HybridCacheStore] Failed to initialize PostgreSQL client. Falling back to memory-only cache:', (err as Error).message);
        this.sql = null;
      }
    }
  }

  private async checkDatabaseConnection(): Promise<void> {
    if (!this.sql) return;
    try {
      await this.sql`SELECT 1`;
      this.dbHealthy = true;
      console.log('[HybridCacheStore] Connected to Supabase / PostgreSQL translation memory.');
    } catch (err) {
      this.dbHealthy = false;
      console.warn('[HybridCacheStore] Database not reachable. Operating in in-memory mode:', (err as Error).message);
    }
  }

  async get(key: string): Promise<string | null> {
    // 1. Fast L1 Memory Cache
    const inMemory = this.memoryStore.get(key);
    if (inMemory) {
      if (inMemory.expiresAt && Date.now() > inMemory.expiresAt) {
        this.memoryStore.delete(key);
      } else {
        return inMemory.value;
      }
    }

    // 2. L2 Persistent Database (Supabase / Postgres)
    if (this.sql && this.dbHealthy) {
      try {
        const rows = await this.sql`
          SELECT translated_text, provider, review_status
          FROM translation_memory
          WHERE cache_key = ${key}
            AND (expires_at IS NULL OR expires_at > NOW())
          LIMIT 1
        `;

        if (rows.length > 0) {
          const row = rows[0];
          const payload = JSON.stringify({
            translatedText: row.translated_text,
            provider: row.provider,
            status: 'memory_hit',
          });

          // Populate L1 cache for subsequent lookups
          this.memoryStore.set(key, { value: payload, expiresAt: Date.now() + 3600 * 1000 });

          // Asynchronously increment hit count
          this.sql`
            UPDATE translation_memory
            SET hit_count = hit_count + 1
            WHERE cache_key = ${key}
          `.catch(() => {});

          return payload;
        }
      } catch (err) {
        console.warn(`[HybridCacheStore] Error querying DB cache for key ${key}:`, (err as Error).message);
      }
    }

    return null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    // 1. Store in L1 memory
    this.memoryStore.set(key, { value, expiresAt });

    // 2. Persist to L2 Database (Supabase / Postgres)
    if (this.sql && this.dbHealthy) {
      try {
        const parsed = JSON.parse(value);
        const parts = key.split(':');
        // Key format: tm:sourceLang:targetLang:domain:glossaryVersion:hash
        const sourceLang = parts[1] || 'fr';
        const targetLang = parts[2] || 'ewo-CM';
        const domain = parts[3] || 'general';
        const expiresAtDate = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : null;

        await this.sql`
          INSERT INTO translation_memory (
            cache_key,
            source_text,
            translated_text,
            source_lang,
            target_lang,
            domain,
            provider,
            review_status,
            expires_at
          ) VALUES (
            ${key},
            ${parsed.translatedText || key},
            ${parsed.translatedText},
            ${sourceLang},
            ${targetLang},
            ${domain},
            ${parsed.provider || 'unknown'},
            'certified',
            ${expiresAtDate}
          )
          ON CONFLICT (cache_key) DO UPDATE SET
            hit_count = translation_memory.hit_count + 1,
            translated_text = EXCLUDED.translated_text
        `;
      } catch (err) {
        console.warn(`[HybridCacheStore] Error saving to DB cache:`, (err as Error).message);
      }
    }
  }

  clear(): void {
    this.memoryStore.clear();
  }

  async close(): Promise<void> {
    if (this.sql) {
      await this.sql.end({ timeout: 2 });
    }
  }
}
