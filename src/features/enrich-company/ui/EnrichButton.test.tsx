/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnrichButton } from './EnrichButton';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: any) => {
    if (key === 'relativeTime.hoursAgo') {
      return params?.count === 1 ? '1 hour ago' : `${params?.count} hours ago`;
    }
    if (key === 'relativeTime.daysAgo') {
      return params?.count === 1 ? '1 day ago' : `${params?.count} days ago`;
    }
    if (key === 'relativeTime.minutesAgo') {
      return params?.count === 1 ? '1 minute ago' : `${params?.count} minutes ago`;
    }
    if (key === 'relativeTime.justNow') {
      return 'just now';
    }
    return key;
  },
}));

// Mock enrichCompany API
vi.mock('../api/enrichCompany', () => ({
  enrichCompany: vi.fn(),
  getEnrichmentStatus: vi.fn(),
}));

import { enrichCompany, getEnrichmentStatus } from '../api/enrichCompany';

const mockEnrichCompany = vi.mocked(enrichCompany);
const mockGetEnrichmentStatus = vi.mocked(getEnrichmentStatus);

describe('EnrichButton - timestamp display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnrichCompany.mockResolvedValue({ enrichmentId: 'test-123' });
    mockGetEnrichmentStatus.mockResolvedValue({ status: 'PENDING' });
  });

  it('displays timestamp when lastEnrichment is provided', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    render(
      <EnrichButton 
        ticker="AAPL" 
        lastEnrichment={{ createdAt: twoHoursAgo }}
      />
    );

    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });

  it('does not display timestamp when lastEnrichment is null', () => {
    render(
      <EnrichButton 
        ticker="AAPL" 
        lastEnrichment={null}
      />
    );

    // The timestamp text should not be in the document
    expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
  });

  it('displays yellow color for stale data (>7 days)', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    
    render(
      <EnrichButton 
        ticker="AAPL" 
        lastEnrichment={{ createdAt: tenDaysAgo }}
      />
    );

    const timestampDiv = screen.getByText('10 days ago').parentElement;
    expect(timestampDiv).toHaveClass('text-yellow-600');
    expect(timestampDiv).toHaveClass('dark:text-yellow-400');
  });

  it('displays gray color for fresh data (<7 days)', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    
    render(
      <EnrichButton 
        ticker="AAPL" 
        lastEnrichment={{ createdAt: twoDaysAgo }}
      />
    );

    const timestampDiv = screen.getByText('2 days ago').parentElement;
    expect(timestampDiv).toHaveClass('text-zinc-500');
    expect(timestampDiv).toHaveClass('dark:text-zinc-400');
  });

  it('updates timestamp text with correct relative time', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    render(
      <EnrichButton 
        ticker="AAPL" 
        lastEnrichment={{ createdAt: oneHourAgo }}
      />
    );

    expect(screen.getByText('1 hour ago')).toBeInTheDocument();
  });

  it('hides timestamp while loading', async () => {
    const user = userEvent.setup();
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    render(
      <EnrichButton 
        ticker="AAPL" 
        lastEnrichment={{ createdAt: twoHoursAgo }}
      />
    );

    // Initially timestamp should be visible
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();

    // Click the enrich button to trigger loading state
    const enrichButton = screen.getByRole('button', { name: /enrich with finnhub/i });
    await user.click(enrichButton);

    // Wait for loading state to activate
    await waitFor(() => {
      expect(screen.getByText(/queued|analyzing/i)).toBeInTheDocument();
    });

    // Timestamp should be hidden during loading
    expect(screen.queryByText('2 hours ago')).not.toBeInTheDocument();
  });
});
