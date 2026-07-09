/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('EnrichButton - timestamp display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
