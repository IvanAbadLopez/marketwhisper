/**
 * Client-side translation cache using localStorage
 * Caches translations for 24 hours or until enrichment is updated
 */

const CACHE_PREFIX = 'mw_translation_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedTranslation {
  translation: string;
  timestamp: number;
  enrichmentUpdatedAt: string;
}

/**
 * Get cached translation if valid
 * @param enrichmentId - Enrichment ID
 * @param currentUpdatedAt - Current enrichment updatedAt timestamp
 * @returns Cached translation or null if invalid/expired
 */
export function getCachedTranslation(
  enrichmentId: string,
  currentUpdatedAt: string
): string | null {
  if (typeof window === 'undefined') return null; // SSR safety

  try {
    const key = `${CACHE_PREFIX}${enrichmentId}`;
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;

    const parsed: CachedTranslation = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired (> 24h)
    if (now - parsed.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }

    // Check if enrichment was updated (invalidate cache)
    if (parsed.enrichmentUpdatedAt !== currentUpdatedAt) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.translation;
  } catch (error) {
    console.error('[TranslationCache] Error reading cache:', error);
    return null;
  }
}

/**
 * Store translation in cache
 * @param enrichmentId - Enrichment ID
 * @param translation - Translation text
 * @param enrichmentUpdatedAt - Enrichment updatedAt timestamp
 */
export function setCachedTranslation(
  enrichmentId: string,
  translation: string,
  enrichmentUpdatedAt: string
): void {
  if (typeof window === 'undefined') return; // SSR safety

  try {
    const key = `${CACHE_PREFIX}${enrichmentId}`;
    const cached: CachedTranslation = {
      translation,
      timestamp: Date.now(),
      enrichmentUpdatedAt,
    };

    localStorage.setItem(key, JSON.stringify(cached));
  } catch (error) {
    console.error('[TranslationCache] Error writing cache:', error);
    // Not critical, continue without caching
  }
}

/**
 * Clear all translation caches (useful for debugging)
 */
export function clearTranslationCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];
    
    // Collect keys that match the prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove collected keys
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('[TranslationCache] Error clearing cache:', error);
  }
}
