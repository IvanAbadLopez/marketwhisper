/**
 * Tests for Finnhub ticker resolution
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveTicker, fetchCompanyNews } from './finnhub';

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

describe('fetchCompanyNews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch news for a ticker successfully', async () => {
    const mockResponse = {
      success: true,
      ticker: 'AAPL',
      news: [
        {
          title: 'Apple announces new product',
          summary: 'Apple Inc. announced...',
          publisher: 'Bloomberg',
          link: 'https://example.com/news1',
          publishedAt: '2026-07-15T10:00:00Z',
          image: 'https://example.com/image1.jpg',
        },
        {
          title: 'Apple stock rises',
          summary: 'Apple shares gained...',
          publisher: 'Reuters',
          link: 'https://example.com/news2',
          publishedAt: '2026-07-14T15:00:00Z',
          image: null,
        },
      ],
      count: 2,
      fromDate: '2026-07-08',
      toDate: '2026-07-15',
      timestamp: '2026-07-15T12:00:00Z',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const news = await fetchCompanyNews('AAPL', 7);
    
    expect(news).toHaveLength(2);
    expect(news[0].title).toBe('Apple announces new product');
    expect(news[0].summary).toBe('Apple Inc. announced...');
    expect(news[1].publisher).toBe('Reuters');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/news-finnhub/AAPL?days=7')
    );
  });

  it('should return empty array for invalid ticker', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const news = await fetchCompanyNews('INVALID');
    
    expect(news).toEqual([]);
  });

  it('should handle rate limit errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    await expect(fetchCompanyNews('AAPL')).rejects.toThrow('rate limit exceeded');
  });

  it('should handle service unavailable errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    await expect(fetchCompanyNews('AAPL')).rejects.toThrow('service unavailable');
  });

  it('should return empty array for empty ticker', async () => {
    const news1 = await fetchCompanyNews('');
    const news2 = await fetchCompanyNews('   ');
    
    expect(news1).toEqual([]);
    expect(news2).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchCompanyNews('AAPL')).rejects.toThrow('Network error');
  });

  it('should normalize ticker to uppercase', async () => {
    const mockResponse = {
      success: true,
      ticker: 'AAPL',
      news: [],
      count: 0,
      fromDate: '2026-07-08',
      toDate: '2026-07-15',
      timestamp: '2026-07-15T12:00:00Z',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await fetchCompanyNews('aapl', 7);
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/news-finnhub/AAPL?days=7')
    );
  });
});
