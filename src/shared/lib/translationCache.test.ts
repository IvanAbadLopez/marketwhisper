/**
 * Unit tests for translation cache utilities
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getCachedTranslation, setCachedTranslation, clearTranslationCache } from './translationCache';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('translationCache', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setCachedTranslation', () => {
    it('should store translation in localStorage', () => {
      const enrichmentId = 'enrich123';
      const translation = 'Traducción de prueba';
      const updatedAt = '2026-07-13T10:00:00Z';

      setCachedTranslation(enrichmentId, translation, updatedAt);

      const stored = localStorageMock.getItem('mw_translation_enrich123');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.translation).toBe(translation);
      expect(parsed.enrichmentUpdatedAt).toBe(updatedAt);
      expect(parsed.timestamp).toBeGreaterThan(0);
    });

    it('should handle localStorage errors gracefully', () => {
      const spy = vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      expect(() => {
        setCachedTranslation('test', 'translation', '2026-07-13T10:00:00Z');
      }).not.toThrow();

      spy.mockRestore();
    });
  });

  describe('getCachedTranslation', () => {
    it('should return cached translation if valid', () => {
      const enrichmentId = 'enrich123';
      const translation = 'Traducción válida';
      const updatedAt = '2026-07-13T10:00:00Z';

      setCachedTranslation(enrichmentId, translation, updatedAt);

      const result = getCachedTranslation(enrichmentId, updatedAt);
      expect(result).toBe(translation);
    });

    it('should return null if cache does not exist', () => {
      const result = getCachedTranslation('nonexistent', '2026-07-13T10:00:00Z');
      expect(result).toBeNull();
    });

    it('should return null and remove cache if expired (>24h)', () => {
      const enrichmentId = 'enrich123';
      const translation = 'Traducción vieja';
      const updatedAt = '2026-07-13T10:00:00Z';

      // Manually create expired cache
      const expiredCache = {
        translation,
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        enrichmentUpdatedAt: updatedAt,
      };
      localStorageMock.setItem('mw_translation_enrich123', JSON.stringify(expiredCache));

      const result = getCachedTranslation(enrichmentId, updatedAt);
      expect(result).toBeNull();

      // Should be removed from localStorage
      expect(localStorageMock.getItem('mw_translation_enrich123')).toBeNull();
    });

    it('should return null and remove cache if enrichment was updated', () => {
      const enrichmentId = 'enrich123';
      const translation = 'Traducción desactualizada';
      const oldUpdatedAt = '2026-07-12T10:00:00Z';
      const newUpdatedAt = '2026-07-13T10:00:00Z';

      setCachedTranslation(enrichmentId, translation, oldUpdatedAt);

      // Query with new updatedAt
      const result = getCachedTranslation(enrichmentId, newUpdatedAt);
      expect(result).toBeNull();

      // Should be removed from localStorage
      expect(localStorageMock.getItem('mw_translation_enrich123')).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      const spy = vi.spyOn(localStorageMock, 'getItem').mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const result = getCachedTranslation('test', '2026-07-13T10:00:00Z');
      expect(result).toBeNull();

      spy.mockRestore();
    });

    it('should handle invalid JSON gracefully', () => {
      localStorageMock.setItem('mw_translation_test', 'invalid json');

      const result = getCachedTranslation('test', '2026-07-13T10:00:00Z');
      expect(result).toBeNull();
    });
  });

  describe('clearTranslationCache', () => {
    it('should remove all translation caches', () => {
      setCachedTranslation('enrich1', 'Translation 1', '2026-07-13T10:00:00Z');
      setCachedTranslation('enrich2', 'Translation 2', '2026-07-13T10:00:00Z');
      
      // Add unrelated key
      localStorageMock.setItem('other_key', 'other value');

      clearTranslationCache();

      // Translation caches should be removed
      expect(localStorageMock.getItem('mw_translation_enrich1')).toBeNull();
      expect(localStorageMock.getItem('mw_translation_enrich2')).toBeNull();

      // Other keys should remain
      expect(localStorageMock.getItem('other_key')).toBe('other value');
    });

    it('should handle localStorage errors gracefully', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock Object.keys to throw
      const originalKeys = Object.keys;
      Object.keys = vi.fn().mockImplementation(() => {
        throw new Error('Cannot read keys');
      });

      // Should not throw
      expect(() => {
        clearTranslationCache();
      }).not.toThrow();

      Object.keys = originalKeys;
      spy.mockRestore();
    });
  });
});
