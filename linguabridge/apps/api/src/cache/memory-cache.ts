import type { CacheStore } from '@linguabridge/translation-engine';

export class MemoryCacheStore implements CacheStore {
  private store: Map<string, { value: string; expiresAt?: number }> = new Map();

  constructor(private maxEntries = 2000) {}

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.delete(key);
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expiresAt });
  }

  clear(): void {
    this.store.clear();
  }
}
