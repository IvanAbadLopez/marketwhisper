/**
 * Tests for Finnhub ticker resolution
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveTicker } from './finnhub';

// Mock fetch globally
global.fetch = vi.fn();

describe('resolveTicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve a company name to ticker (Common Stock)', async () => {
    const mockResponse = {
      success: true,
      query: 'Alibaba',
      count: 2,
      results: [
        {
          symbol: 'BABA',
          description: 'Alibaba Group Holding Ltd ADR',
          displaySymbol: 'BABA',
          type: 'Common Stock',
        },
        {
          symbol: '9988.HK',
          description: 'Alibaba Group Holding Ltd',
          displaySymbol: '9988.HK',
          type: 'Common Stock',
        },
      ],
      timestamp: '2026-07-13T00:00:00Z',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const ticker = await resolveTicker('Alibaba');
    
    expect(ticker).toBe('BABA');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/search-finnhub?q=Alibaba'),
      expect.any(Object)
    );
  });

  it('should return empty string when no results found', async () => {
    const mockResponse = {
      success: true,
      query: 'NonExistentCompany',
      count: 0,
      results: [],
      timestamp: '2026-07-13T00:00:00Z',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const ticker = await resolveTicker('NonExistentCompany');
    
    expect(ticker).toBe('');
  });

  it('should prefer US symbols over foreign exchanges', async () => {
    const mockResponse = {
      success: true,
      query: 'Tencent',
      count: 2,
      results: [
        {
          symbol: '0700.HK',
          description: 'Tencent Holdings Ltd',
          displaySymbol: '0700.HK',
          type: 'Common Stock',
        },
        {
          symbol: 'TCEHY',
          description: 'Tencent Holdings Ltd ADR',
          displaySymbol: 'TCEHY',
          type: 'ADR',
        },
      ],
      timestamp: '2026-07-13T00:00:00Z',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const ticker = await resolveTicker('Tencent');
    
    // Should prefer TCEHY (no dot) over 0700.HK
    expect(ticker).toBe('TCEHY');
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    });

    const ticker = await resolveTicker('Test Company');
    
    expect(ticker).toBe('');
  });

  it('should return empty string for empty input', async () => {
    const ticker1 = await resolveTicker('');
    const ticker2 = await resolveTicker('   ');
    
    expect(ticker1).toBe('');
    expect(ticker2).toBe('');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const ticker = await resolveTicker('Test Company');
    
    expect(ticker).toBe('');
  });

  it('should pick shortest symbol when multiple matches', async () => {
    const mockResponse = {
      success: true,
      query: 'Apple',
      count: 2,
      results: [
        {
          symbol: 'AAPLLONG',
          description: 'Apple Inc. Class B',
          displaySymbol: 'AAPLLONG',
          type: 'Common Stock',
        },
        {
          symbol: 'AAPL',
          description: 'Apple Inc.',
          displaySymbol: 'AAPL',
          type: 'Common Stock',
        },
      ],
      timestamp: '2026-07-13T00:00:00Z',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const ticker = await resolveTicker('Apple');
    
    expect(ticker).toBe('AAPL');
  });
});
