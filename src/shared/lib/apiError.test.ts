import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logError, getSafeErrorMessage, createErrorResponse } from './apiError';

describe('logError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs Error instance with message and stack', () => {
    const error = new Error('Test error');
    logError('TestContext', error);

    expect(console.error).toHaveBeenCalledWith(
      '[TestContext] Error:',
      expect.objectContaining({
        message: 'Test error',
        stack: expect.any(String),
        timestamp: expect.any(String),
      })
    );
  });

  it('logs non-Error values as unknown error', () => {
    logError('TestContext', 'string error');

    expect(console.error).toHaveBeenCalledWith(
      '[TestContext] Error:',
      expect.objectContaining({
        message: 'Unknown error',
        stack: undefined,
      })
    );
  });
});

describe('getSafeErrorMessage', () => {
  it('returns safe error messages for known patterns', () => {
    const safeErrors = [
      new Error('Rate limit exceeded'),
      new Error('Invalid email format'),
      new Error('Password must be at least 8 characters'),
      new Error('Unauthorized access'),
      new Error('Finnhub API error'),
    ];

    safeErrors.forEach(error => {
      expect(getSafeErrorMessage(error)).toBe(error.message);
    });
  });

  it('returns generic message for unsafe errors', () => {
    const unsafeErrors = [
      new Error('ECONNREFUSED localhost:5432'),
      new Error('Cannot read property of undefined at /app/src/file.ts:123'),
      new Error('Prisma Client validation error: Unknown field'),
    ];

    unsafeErrors.forEach(error => {
      expect(getSafeErrorMessage(error)).toBe('An error occurred');
    });
  });

  it('returns custom fallback for unsafe errors', () => {
    const error = new Error('Internal database constraint violation');
    expect(getSafeErrorMessage(error, 'Database operation failed')).toBe(
      'Database operation failed'
    );
  });

  it('returns fallback for non-Error values', () => {
    expect(getSafeErrorMessage('string error')).toBe('An error occurred');
    expect(getSafeErrorMessage(null)).toBe('An error occurred');
    expect(getSafeErrorMessage(undefined)).toBe('An error occurred');
  });
});

describe('createErrorResponse', () => {
  it('returns Response with safe error message', async () => {
    const error = new Error('Database connection timeout at pg:5432');
    const response = createErrorResponse(error, 'Failed to fetch data', 500);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: 'Failed to fetch data' });
  });

  it('preserves known safe error messages', async () => {
    const error = new Error('Rate limit exceeded');
    const response = createErrorResponse(error, 'Generic error', 429);

    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data).toEqual({ error: 'Rate limit exceeded' });
  });

  it('logs error when context provided', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const error = new Error('Test error');
    createErrorResponse(error, 'Failed', 500, 'TestEndpoint');

    expect(console.error).toHaveBeenCalledWith(
      '[TestEndpoint] Error:',
      expect.any(Object)
    );

    vi.restoreAllMocks();
  });
});
