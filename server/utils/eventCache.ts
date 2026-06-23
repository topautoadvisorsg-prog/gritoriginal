class EventResponseCache<T> {
  private cache = new Map<string, { value: T; expires: number }>();
  constructor(private ttlMs: number) {}
  
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return undefined;
    }
    return item.value;
  }
  
  set(key: string, value: T) {
    this.cache.set(key, { value, expires: Date.now() + this.ttlMs });
  }

  /**
   * Instantly destroy a cached response to force a DB re-read
   * Call whenever a major event state mutation occurs (picks, odds, status)
   */
  invalidate(key: string) {
    this.cache.delete(key);
  }

  clearAll() {
    this.cache.clear();
  }
}

export const eventCache = new EventResponseCache<unknown>(30000);
