/**
 * Tiny dependency-free in-memory TTL cache.
 *
 * YouTube's Data API has a daily quota, and our channel's uploads change at
 * most a few times a day — so we cache responses briefly to stay well under
 * quota and keep the Community page snappy on repeat visits. A process-local
 * Map is intentional: zero infra, and a server restart simply re-warms it.
 */
class TTLCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key, value, ttlMs) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }

  /** Get from cache, or run `fn`, cache its result, and return it. */
  async wrap(key, ttlMs, fn) {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    const value = await fn();
    return this.set(key, value, ttlMs);
  }
}

export const cache = new TTLCache();

export default cache;
