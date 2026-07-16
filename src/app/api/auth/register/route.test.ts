import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/shared/api/prisma';
import bcrypt from 'bcrypt';
import { getClientIp } from '@/shared';

vi.mock('@/shared/api/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('bcrypt');

vi.mock('@/shared', async () => {
  const actual = await vi.importActual('@/shared');
  return {
    ...actual,
    getClientIp: vi.fn(() => '127.0.0.1'),
    checkRateLimit: vi.fn(() => ({
      success: true,
      limit: 3,
      remaining: 2,
      reset: Date.now() + 3600000,
    })),
  };
});

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    const { checkRateLimit, getClientIp } = vi.importMock('@/shared');
    if (checkRateLimit) {
      vi.mocked(checkRateLimit).mockReturnValue({
        success: true,
        limit: 3,
        remaining: 2,
        reset: Date.now() + 3600000,
      });
    }
    if (getClientIp) {
      vi.mocked(getClientIp).mockReturnValue('127.0.0.1');
    }
  });

  describe('Input Validation - Email', () => {
    it('returns 400 for missing email', async () => {
      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email is required');
    });

    it('returns 400 for non-string email', async () => {
      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 12345, password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email is required');
    });

    it('returns 400 for invalid email format', async () => {
      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'notanemail', password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email format');
    });

    it('returns 400 for email without @', async () => {
      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'user.example.com', password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email format');
    });

    it('returns 400 for email without domain', async () => {
      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@', password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email format');
    });

    it('returns 400 for email exceeding 254 characters', async () => {
      const longEmail = 'a'.repeat(246) + '@test.com';
      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: longEmail, password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email must not exceed 254 characters');
    });

    it('accepts email at exactly 254 characters', async () => {
      const maxEmail = 'a'.repeat(244) + '@test.com';
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        email: maxEmail,
        name: null,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: maxEmail, password: 'password123' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Input Validation - Password', () => {
    it('returns 400 for missing password', async () => {
      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Password is required');
    });

    it('returns 400 for non-string password', async () => {
      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 12345678 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Password is required');
    });

    it('returns 400 for password shorter than 8 characters', async () => {
      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'pass123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Password must be at least 8 characters');
    });

    it('accepts password at exactly 8 characters', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: null,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'pass1234' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('returns 400 for password exceeding 200 characters', async () => {
      const longPassword = 'a'.repeat(201);
      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: longPassword }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Password must not exceed 200 characters');
    });

    it('accepts password at exactly 200 characters', async () => {
      const maxPassword = 'a'.repeat(200);
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: null,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: maxPassword }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Input Validation - Name', () => {
    it('returns 400 for non-string name', async () => {
      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'test@example.com', 
          password: 'password123',
          name: 12345
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name must be a string');
    });

    it('returns 400 for name exceeding 100 characters', async () => {
      const longName = 'a'.repeat(101);
      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'test@example.com', 
          password: 'password123',
          name: longName
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name must not exceed 100 characters');
    });

    it('accepts name at exactly 100 characters', async () => {
      const maxName = 'a'.repeat(100);
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: maxName,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'test@example.com', 
          password: 'password123',
          name: maxName
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('converts empty string name to null after trim', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: null,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'test@example.com', 
          password: 'password123',
          name: '   '
        }),
      });

      await POST(request);

      expect(vi.mocked(prisma.user.create)).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: null,
          password: 'hashed_password',
        },
      });
    });

    it('trims whitespace from name', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'John Doe',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'test@example.com', 
          password: 'password123',
          name: '  John Doe  '
        }),
      });

      await POST(request);

      expect(vi.mocked(prisma.user.create)).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: 'John Doe',
          password: 'hashed_password',
        },
      });
    });
  });

  describe('Email Normalization', () => {
    it('normalizes email by trimming and lowercasing', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: null,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          email: '  TEST@EXAMPLE.COM  ', 
          password: 'password123'
        }),
      });

      await POST(request);

      expect(vi.mocked(prisma.user.findUnique)).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });

      expect(vi.mocked(prisma.user.create)).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: null,
          password: 'hashed_password',
        },
      });
    });
  });

  describe('Successful Registration', () => {
    it('creates user successfully with valid data', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'test@example.com', 
          password: 'password123',
          name: 'Test User'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Registration processed successfully. If the email is not already registered, your account has been created. You can now sign in.');
      expect(data.userId).toBe('123');

      expect(vi.mocked(bcrypt.hash)).toHaveBeenCalledWith('password123', 12);

      expect(vi.mocked(prisma.user.create)).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password: 'hashed_password',
        },
      });
    });

    it('creates user with null name when name is not provided', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        name: null,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'test@example.com', 
          password: 'password123'
        }),
      });

      await POST(request);

      expect(vi.mocked(prisma.user.create)).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: null,
          password: 'hashed_password',
        },
      });
    });
  });

  describe('Anti-Enumeration Pattern', () => {
    it('returns generic success message for existing user (anti-enumeration)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: '999',
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'existing_hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      vi.mocked(bcrypt.hash).mockResolvedValue('dummy_hash' as never);

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'existing@example.com', 
          password: 'password123'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      expect(data.message).toBe('Registration processed successfully. If the email is not already registered, your account has been created. You can now sign in.');
      
      expect(data.userId).toBeUndefined();

      expect(vi.mocked(bcrypt.hash)).toHaveBeenCalledWith('dummy-password-for-timing-attack-prevention', 12);

      expect(vi.mocked(prisma.user.create)).not.toHaveBeenCalled();
    });

    it('returns generic success message for new user (same as existing)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '123',
        email: 'new@example.com',
        name: null,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'new@example.com', 
          password: 'password123'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      expect(data.message).toBe('Registration processed successfully. If the email is not already registered, your account has been created. You can now sign in.');

      expect(vi.mocked(prisma.user.create)).toHaveBeenCalled();
    });

    it('ensures timing consistency between existing and new user flows', async () => {
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: '999',
        email: 'existing@example.com',
        name: null,
        password: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(bcrypt.hash).mockResolvedValue('dummy_hash' as never);

      const existingRequest = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'existing@example.com', 
          password: 'password123'
        }),
      });

      await POST(existingRequest);

      expect(vi.mocked(bcrypt.hash)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(bcrypt.hash)).toHaveBeenCalledWith('dummy-password-for-timing-attack-prevention', 12);

      vi.clearAllMocks();

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '123',
        email: 'new@example.com',
        name: null,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const newRequest = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'new@example.com', 
          password: 'password123'
        }),
      });

      await POST(newRequest);

      expect(vi.mocked(bcrypt.hash)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(bcrypt.hash)).toHaveBeenCalledWith('password123', 12);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 for database errors', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('Database connection failed'));

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'test@example.com', 
          password: 'password123'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('returns 500 for bcrypt hashing errors', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockRejectedValue(new Error('Hashing failed'));

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'test@example.com', 
          password: 'password123'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Rate Limiting', () => {
    it('returns 429 when rate limit exceeded', async () => {
      const mockIp = '1.2.3.4';
      
      const { checkRateLimit } = await import('@/shared');
      
      vi.mocked(getClientIp).mockReturnValue(mockIp);
      vi.mocked(checkRateLimit).mockReturnValue({
        success: false,
        limit: 3,
        remaining: 0,
        reset: Date.now() + 3600000,
      });

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'test@example.com', 
          password: 'password123' 
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Too many');
      expect(response.headers.get('Retry-After')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Limit')).toBe('3');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });

    it('allows request when within rate limit', async () => {
      const { checkRateLimit } = await import('@/shared');
      
      vi.mocked(getClientIp).mockReturnValue('1.2.3.4');
      vi.mocked(checkRateLimit).mockReturnValue({
        success: true,
        limit: 3,
        remaining: 2,
        reset: Date.now() + 3600000,
      });
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: null,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'test@example.com', 
          password: 'password123' 
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(checkRateLimit)).toHaveBeenCalledWith(
        'register:1.2.3.4',
        { max: 3, windowMs: 3600000 }
      );
    });
  });
});
