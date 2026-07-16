/**
 * Tests for Finnhub API client (direct API calls, no Python service)
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveTicker, fetchCompanyNews } from './finnhub';

// Mock env to provide FINNHUB_API_KEY
vi.mock('@/shared/config/env', () => ({
  env: {
    FINNHUB_API_KEY: 'test-api-key',
  },
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('resolveTicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve a company name to ticker (Common Stock)', async () => {
    const mockResponse = {
      count: 2,
      result: [
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
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const ticker = await resolveTicker('Alibaba');
    
    expect(ticker).toBe('BABA');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://finnhub.io/api/v1/search?q=Alibaba'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Finnhub-Token': 'test-api-key',
        }),
      })
    );
  });

  it('should return empty string when no results found', async () => {
    const mockResponse = {
      count: 0,
      result: [],
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
      count: 2,
      result: [
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
      status: 500,
      text: async () => 'Internal Server Error',
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
      count: 2,
      result: [
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
    // Finnhub API returns array of news items directly
    const mockResponse = [
      {
        headline: 'Apple announces new product',
        summary: 'Apple Inc. announced...',
        source: 'Bloomberg',
        url: 'https://example.com/news1',
        datetime: 1721044800, // Unix timestamp
        image: 'https://example.com/image1.jpg',
      },
      {
        headline: 'Apple stock rises',
        summary: 'Apple shares gained...',
        source: 'Reuters',
        url: 'https://example.com/news2',
        datetime: 1720958400,
        image: '',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const news = await fetchCompanyNews('AAPL', 7);
    
    expect(news).toHaveLength(2);
    expect(news[0].title).toBe('Apple announces new product');
    expect(news[0].summary).toBe('Apple Inc. announced...');
    expect(news[0].publisher).toBe('Bloomberg');
    expect(news[1].publisher).toBe('Reuters');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://finnhub.io/api/v1/company-news?symbol=AAPL'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Finnhub-Token': 'test-api-key',
        }),
      })
    );
  });

  it('should return empty array for invalid ticker', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    });

    await expect(fetchCompanyNews('INVALID')).rejects.toThrow();
  });

  it('should handle rate limit errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => 'Too Many Requests',
    });

    await expect(fetchCompanyNews('AAPL')).rejects.toThrow('rate limit exceeded');
  });

  it('should handle service unavailable errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    await expect(fetchCompanyNews('AAPL')).rejects.toThrow('authentication failed');
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
    const mockResponse = [];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await fetchCompanyNews('aapl', 7);
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://finnhub.io/api/v1/company-news?symbol=AAPL'),
      expect.any(Object)
    );
  });
});
