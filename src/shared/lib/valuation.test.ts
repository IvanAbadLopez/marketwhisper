import { describe, it, expect } from 'vitest';
import { computeValuation, type ValuationInputs } from './valuation';

describe('computeValuation', () => {
  const createInputs = (overrides: Partial<ValuationInputs> = {}): ValuationInputs => ({
    eps: null,
    peRatio: null,
    bookValuePerShare: null,
    roe: null,
    profitMargins: null,
    debtToEquity: null,
    dividendYield: null,
    epsGrowth: null,
    currentPrice: null,
    fiftyTwoWeekHigh: null,
    fiftyTwoWeekLow: null,
    analystScore: null,
    avgSentimentScore: null,
    avgReliabilityScore: null,
    analysisCount: 0,
    ...overrides,
  });

  it('should return null score and price when no data available', () => {
    const result = computeValuation(createInputs());
    
    expect(result.globalScore).toBeNull();
    expect(result.globalScoreLabel).toBe('N/A');
    expect(result.targetPrice).toBeNull();
  });

  it('should compute Graham Number correctly', () => {
    const result = computeValuation(createInputs({
      eps: 5.0,
      bookValuePerShare: 25.0,
      fiftyTwoWeekHigh: 150,
      fiftyTwoWeekLow: 100,
    }));
    
    expect(result.breakdown.targetPriceMethods.grahamNumber).toBeCloseTo(53.03, 1);
  });

  it('should compute fair P/E target with growth adjustment', () => {
    const result = computeValuation(createInputs({
      eps: 10.0,
      peRatio: 30,
      epsGrowth: 0.15,
      fiftyTwoWeekHigh: 350,
      fiftyTwoWeekLow: 250,
    }));
    
    expect(result.breakdown.targetPriceMethods.fairPE).toBeCloseTo(225, 0);
  });

  it('should compute 52-week midpoint', () => {
    const result = computeValuation(createInputs({
      fiftyTwoWeekHigh: 200,
      fiftyTwoWeekLow: 100,
    }));
    
    expect(result.breakdown.targetPriceMethods.fiftyTwoWeekMid).toBe(150);
  });

  it('should compute financial health score with ideal metrics', () => {
    const result = computeValuation(createInputs({
      peRatio: 18,
      profitMargins: 0.25,
      roe: 20,
      debtToEquity: 0.3,
      dividendYield: 0.03,
    }));
    
    expect(result.breakdown.financialHealthScore).toBeGreaterThan(90);
  });

  it('should penalize poor financial metrics', () => {
    const result = computeValuation(createInputs({
      peRatio: 50,
      profitMargins: 0.05,
      roe: 5,
      debtToEquity: 2.5,
    }));
    
    expect(result.breakdown.financialHealthScore).toBeLessThan(50);
  });

  it('should compute analyst score from consensus', () => {
    const result = computeValuation(createInputs({
      analystScore: 0.6,
      fiftyTwoWeekHigh: 100,
      fiftyTwoWeekLow: 80,
    }));
    
    expect(result.breakdown.analystScore).toBe(80);
  });

  it('should compute text sentiment score with reliability weighting', () => {
    const result = computeValuation(createInputs({
      avgSentimentScore: 0.5,
      avgReliabilityScore: 8,
      analysisCount: 5,
      fiftyTwoWeekHigh: 100,
      fiftyTwoWeekLow: 80,
    }));
    
    expect(result.breakdown.textSentimentScore).toBeCloseTo(61.5, 0);
  });

  it('should rescale weights when data is missing', () => {
    const result = computeValuation(createInputs({
      peRatio: 15,
      analystScore: 0.4,
    }));
    
    expect(result.breakdown.weights.financial).toBeCloseTo(0.533, 2);
    expect(result.breakdown.weights.analyst).toBeCloseTo(0.467, 2);
    expect(result.breakdown.weights.text).toBe(0);
  });

  it('should assign correct labels to global scores', () => {
    expect(computeValuation(createInputs({ analystScore: 0.8 })).globalScoreLabel).toBe('Strong');
    expect(computeValuation(createInputs({ analystScore: 0.4 })).globalScoreLabel).toBe('Moderate');
    expect(computeValuation(createInputs({ analystScore: 0.0 })).globalScoreLabel).toBe('Neutral');
    expect(computeValuation(createInputs({ analystScore: -0.6 })).globalScoreLabel).toBe('Weak');
  });

  it('should apply sentiment adjustment to target price', () => {
    const result = computeValuation(createInputs({
      eps: 10,
      bookValuePerShare: 50,
      fiftyTwoWeekHigh: 200,
      fiftyTwoWeekLow: 100,
      analystScore: 0.8,
    }));
    
    expect(result.breakdown.sentimentAdjustment).toBeCloseTo(12, 0);
    expect(result.targetPrice).toBeGreaterThan(result.breakdown.baseTargetPrice!);
  });

  it('should blend multiple target price methods', () => {
    const result = computeValuation(createInputs({
      eps: 10,
      bookValuePerShare: 50,
      peRatio: 20,
      epsGrowth: 0.10,
      fiftyTwoWeekHigh: 250,
      fiftyTwoWeekLow: 150,
    }));
    
    expect(result.breakdown.baseTargetPrice).toBeCloseTo(167, 0);
  });

  it('should handle edge case: negative EPS (no Graham/Fair P/E)', () => {
    const result = computeValuation(createInputs({
      eps: -2,
      bookValuePerShare: 30,
      fiftyTwoWeekHigh: 100,
      fiftyTwoWeekLow: 50,
    }));
    
    expect(result.breakdown.targetPriceMethods.grahamNumber).toBeNull();
    expect(result.breakdown.targetPriceMethods.fairPE).toBeNull();
    expect(result.breakdown.targetPriceMethods.fiftyTwoWeekMid).toBe(75);
    expect(result.targetPrice).toBeCloseTo(75, 0);
  });

  it('should handle partial data gracefully', () => {
    const result = computeValuation(createInputs({
      peRatio: 22,
      avgSentimentScore: 0.3,
      avgReliabilityScore: 7,
      analysisCount: 3,
    }));
    
    expect(result.globalScore).toBeGreaterThan(0);
    expect(result.targetPrice).toBeNull();
  });
});
