type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

/**
 * Retrieves a value from the in-memory cache, or computes and stores it if missing/expired.
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 60_000
): Promise<T> {
  const now = Date.now();
  const entry = store.get(key);

  if (entry && entry.expiresAt > now) {
    return entry.value as T;
  }

  const value = await fetcher();
  store.set(key, {
    value,
    expiresAt: now + ttlMs,
  });

  return value;
}

/**
 * Invalidates cache entries by exact key or key prefix.
 * If no argument is provided, clears the entire cache.
 */
export function invalidateCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    store.clear();
    return;
  }

  for (const key of store.keys()) {
    if (key.startsWith(keyPrefix)) {
      store.delete(key);
    }
  }
}
