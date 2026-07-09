/**
 * Unit tests for translation utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { translateBatchToSpanish } from './translate';

// Mock fetch globally
global.fetch = vi.fn();

describe('translateBatchToSpanish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should translate multiple texts in a single batch', async () => {
    const mockResponse = {
      model: 'llama3.1:8b',
      created_at: '2026-01-01T00:00:00Z',
      response: JSON.stringify({
        translations: [
          'Traducción 1',
          'Traducción 2',
          'Traducción 3',
        ],
      }),
      done: true,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const texts = ['Translation 1', 'Translation 2', 'Translation 3'];
    const result = await translateBatchToSpanish(texts);

    expect(result).toEqual(['Traducción 1', 'Traducción 2', 'Traducción 3']);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    
    // Verify the request was made with format: 'json'
    const callArgs = (global.fetch as any).mock.calls[0][1];
    const body = JSON.parse(callArgs.body);
    expect(body.format).toBe('json');
    expect(body.model).toBe('llama3.1:8b');
  });

  it('should return empty array for empty input', async () => {
    const result = await translateBatchToSpanish([]);
    expect(result).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should fallback to original texts on error', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const texts = ['Text 1', 'Text 2'];
    const result = await translateBatchToSpanish(texts);

    expect(result).toEqual(texts); // Should return original texts
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle translation count mismatch by padding', async () => {
    const mockResponse = {
      model: 'llama3.1:8b',
      created_at: '2026-01-01T00:00:00Z',
      response: JSON.stringify({
        translations: ['Traducción 1'], // Only 1 translation for 3 inputs
      }),
      done: true,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const texts = ['Text 1', 'Text 2', 'Text 3'];
    const result = await translateBatchToSpanish(texts);

    // Should pad with original texts
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Traducción 1');
    expect(result[1]).toBe('Text 2'); // Padded with original
    expect(result[2]).toBe('Text 3'); // Padded with original
  });

  it('should trim whitespace from translations', async () => {
    const mockResponse = {
      model: 'llama3.1:8b',
      created_at: '2026-01-01T00:00:00Z',
      response: JSON.stringify({
        translations: ['  Traducción con espacios  ', '\nTraducción con saltos\n'],
      }),
      done: true,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const texts = ['Text 1', 'Text 2'];
    const result = await translateBatchToSpanish(texts);

    expect(result).toEqual(['Traducción con espacios', 'Traducción con saltos']);
  });
});
