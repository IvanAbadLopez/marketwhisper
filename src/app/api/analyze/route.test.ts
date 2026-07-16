import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/shared/api/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    job: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/features/analyze-text/api/processAnalysis', () => ({
  processAnalysis: vi.fn(),
}));

vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
    after: vi.fn((callback: () => void) => callback()),
  };
});

vi.mock('@/shared', async () => {
  const actual = await vi.importActual('@/shared');
  return {
    ...actual,
    checkRateLimit: vi.fn(() => ({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 3600000,
    })),
  };
});

const { auth } = vi.mocked(await import('@/lib/auth'));
const { prisma } = vi.mocked(await import('@/shared/api/prisma'));

describe('POST /api/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    const { checkRateLimit } = vi.importMock('@/shared');
    if (checkRateLimit) {
      vi.mocked(checkRateLimit).mockReturnValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 3600000,
      });
    }
  });

  describe('Authentication', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test analysis text' }),
      });

      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 401 when session has no email', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: {},
        expires: new Date().toISOString(),
      });

      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test analysis text' }),
      });

      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-123' },
        expires: new Date().toISOString(),
      });
    });

    it('returns 400 when text is missing', async () => {
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Text is required');
    });

    it('returns 400 when text is empty string', async () => {
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ text: '' }),
      });

      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Text is required');
    });

    it('returns 400 when text is whitespace only', async () => {
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ text: '   ' }),
      });

      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Text is required');
    });

    it('returns 400 when text is not a string', async () => {
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ text: 12345 }),
      });

      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Text is required');
    });

    it('returns 400 when text exceeds 10000 characters', async () => {
      const longText = 'a'.repeat(10001);
      
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ text: longText }),
      });

      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('exceeds maximum length');
    });

    it('accepts text at exactly 10000 characters', async () => {
      const { checkRateLimit } = await import('@/shared');
      
      vi.mocked(checkRateLimit).mockReturnValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 3600000,
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: null,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.job.create).mockResolvedValue({
        id: 'job-123',
        userId: 'user-123',
        type: 'ANALYSIS',
        status: 'PENDING',
        ticker: 'PENDING',
        analysisId: null,
        enrichmentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const maxText = 'a'.repeat(10000);
      
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ text: maxText }),
      });

      const response = await POST(request as NextRequest);

      expect(response.status).toBe(202);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-123' },
        expires: new Date().toISOString(),
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: null,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('returns 429 when rate limit exceeded', async () => {
      const { checkRateLimit } = await import('@/shared');
      
      vi.mocked(checkRateLimit).mockReturnValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 3600000,
      });

      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test analysis text' }),
      });

      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Too many');
      expect(response.headers.get('Retry-After')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });

    it('allows request when within rate limit', async () => {
      const { checkRateLimit } = await import('@/shared');
      
      vi.mocked(checkRateLimit).mockReturnValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 3600000,
      });

      vi.mocked(prisma.job.create).mockResolvedValue({
        id: 'job-123',
        userId: 'user-123',
        type: 'ANALYSIS',
        status: 'PENDING',
        ticker: 'PENDING',
        analysisId: null,
        enrichmentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test analysis text' }),
      });

      const response = await POST(request as NextRequest);

      expect(response.status).toBe(202);
      expect(vi.mocked(checkRateLimit)).toHaveBeenCalledWith(
        'analyze:user-123',
        { max: 10, windowMs: 3600000 }
      );
    });
  });

  describe('Successful Analysis', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-123' },
        expires: new Date().toISOString(),
      });

      const { checkRateLimit } = vi.importMock('@/shared');
      if (checkRateLimit) {
        vi.mocked(checkRateLimit).mockReturnValue({
          success: true,
          limit: 10,
          remaining: 9,
          reset: Date.now() + 3600000,
        });
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: null,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.job.create).mockResolvedValue({
        id: 'job-123',
        userId: 'user-123',
        type: 'ANALYSIS',
        status: 'PENDING',
        ticker: 'PENDING',
        analysisId: null,
        enrichmentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('returns 202 with job information', async () => {
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ 
          text: 'Test analysis text',
          source: 'manual'
        }),
      });

      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.success).toBe(true);
      expect(data.jobId).toBe('job-123');
      expect(data.status).toBe('PENDING');
      expect(data.message).toContain('Analysis job started');
    });

    it('creates job with PENDING status', async () => {
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test text' }),
      });

      await POST(request as NextRequest);

      expect(vi.mocked(prisma.job.create)).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          type: 'ANALYSIS',
          status: 'PENDING',
          ticker: 'PENDING',
        },
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { email: 'test@example.com', id: 'user-123' },
        expires: new Date().toISOString(),
      });

      const { checkRateLimit } = vi.importMock('@/shared');
      if (checkRateLimit) {
        vi.mocked(checkRateLimit).mockReturnValue({
          success: true,
          limit: 10,
          remaining: 9,
          reset: Date.now() + 3600000,
        });
      }
    });

    it('returns 404 when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test text' }),
      });

      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('returns 500 for database errors', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test text' }),
      });

      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeTruthy();
    });
  });
});
