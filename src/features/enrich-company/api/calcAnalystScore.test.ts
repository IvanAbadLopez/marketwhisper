/**
 * Tests for analyst sentiment score calculation
 */

import { describe, it, expect } from 'vitest';
import { calcAnalystScore, analystScoreLabel } from '../lib/analystScore';

describe('calcAnalystScore', () => {
  it('should return +1 for all Strong Buy recommendations', () => {
    const rec = {
      period: '2026-07',
      strongBuy: 20,
      buy: 0,
      hold: 0,
      sell: 0,
      strongSell: 0,
    };
    expect(calcAnalystScore(rec)).toBe(1);
  });

  it('should return -1 for all Strong Sell recommendations', () => {
    const rec = {
      period: '2026-07',
      strongBuy: 0,
      buy: 0,
      hold: 0,
      sell: 0,
      strongSell: 15,
    };
    expect(calcAnalystScore(rec)).toBe(-1);
  });

  it('should return 0 for all Hold recommendations', () => {
    const rec = {
      period: '2026-07',
      strongBuy: 0,
      buy: 0,
      hold: 30,
      sell: 0,
      strongSell: 0,
    };
    expect(calcAnalystScore(rec)).toBe(0);
  });

  it('should return null when total is 0', () => {
    const rec = {
      period: '2026-07',
      strongBuy: 0,
      buy: 0,
      hold: 0,
      sell: 0,
      strongSell: 0,
    };
    expect(calcAnalystScore(rec)).toBeNull();
  });

  it('should return positive score for bullish mix', () => {
    const rec = {
      period: '2026-07',
      strongBuy: 12,
      buy: 18,
      hold: 5,
      sell: 1,
      strongSell: 0,
    };
    const score = calcAnalystScore(rec);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
    // Calculation: (12*2 + 18 - 1) / (36*2) = 41/72 ≈ 0.57
    expect(score).toBeCloseTo(0.57, 2);
  });

  it('should return negative score for bearish mix', () => {
    const rec = {
      period: '2026-07',
      strongBuy: 1,
      buy: 2,
      hold: 5,
      sell: 10,
      strongSell: 8,
    };
    const score = calcAnalystScore(rec);
    expect(score).toBeLessThan(0);
    expect(score).toBeGreaterThanOrEqual(-1);
    // Calculation: (1*2 + 2 - 10 - 8*2) / (26*2) = -22/52 ≈ -0.42
    expect(score).toBeCloseTo(-0.42, 2);
  });

  it('should return near 0 for balanced recommendations', () => {
    const rec = {
      period: '2026-07',
      strongBuy: 5,
      buy: 5,
      hold: 10,
      sell: 5,
      strongSell: 5,
    };
    const score = calcAnalystScore(rec);
    expect(score).toBe(0);
  });
});

describe('analystScoreLabel', () => {
  it('should return "N/A" for null score', () => {
    expect(analystScoreLabel(null)).toBe('N/A');
  });

  it('should return "Strong Bullish" for score >= 0.6', () => {
    expect(analystScoreLabel(1.0)).toBe('Strong Bullish');
    expect(analystScoreLabel(0.8)).toBe('Strong Bullish');
    expect(analystScoreLabel(0.6)).toBe('Strong Bullish');
  });

  it('should return "Bullish" for score in [0.2, 0.6)', () => {
    expect(analystScoreLabel(0.5)).toBe('Bullish');
    expect(analystScoreLabel(0.3)).toBe('Bullish');
    expect(analystScoreLabel(0.2)).toBe('Bullish');
  });

  it('should return "Neutral" for score in [-0.2, 0.2)', () => {
    expect(analystScoreLabel(0.1)).toBe('Neutral');
    expect(analystScoreLabel(0.0)).toBe('Neutral');
    expect(analystScoreLabel(-0.1)).toBe('Neutral');
    expect(analystScoreLabel(-0.2)).toBe('Neutral');
  });

  it('should return "Bearish" for score in [-0.6, -0.2)', () => {
    expect(analystScoreLabel(-0.3)).toBe('Bearish');
    expect(analystScoreLabel(-0.5)).toBe('Bearish');
  });

  it('should return "Strong Bearish" for score < -0.6', () => {
    expect(analystScoreLabel(-0.6)).toBe('Strong Bearish');
    expect(analystScoreLabel(-0.8)).toBe('Strong Bearish');
    expect(analystScoreLabel(-1.0)).toBe('Strong Bearish');
  });
});
