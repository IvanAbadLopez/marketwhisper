/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LocaleSwitcher } from './LocaleSwitcher';

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: vi.fn(() => 'en'),
}));

// Mock server action
vi.mock('../api/set-locale', () => ({
  setLocale: vi.fn(() => Promise.resolve()),
}));

describe('LocaleSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders locale buttons', () => {
    render(<LocaleSwitcher />);
    
    const enButton = screen.getByRole('button', { name: /switch to english/i });
    const esButton = screen.getByRole('button', { name: /switch to español/i });
    
    expect(enButton).toBeInTheDocument();
    expect(esButton).toBeInTheDocument();
  });

  it('highlights current locale', () => {
    render(<LocaleSwitcher />);
    
    const enButton = screen.getByRole('button', { name: /switch to english/i });
    
    expect(enButton).toHaveClass('bg-blue-600');
    expect(enButton).toHaveClass('text-white');
  });

  it('allows clicking on non-current locale', () => {
    render(<LocaleSwitcher />);
    
    const esButton = screen.getByRole('button', { name: /switch to español/i });
    
    expect(esButton).not.toBeDisabled();
    expect(esButton).toHaveClass('text-zinc-600');
  });

  it('disables current locale button', () => {
    render(<LocaleSwitcher />);
    
    const enButton = screen.getByRole('button', { name: /switch to english/i });
    
    expect(enButton).toBeDisabled();
  });
});
