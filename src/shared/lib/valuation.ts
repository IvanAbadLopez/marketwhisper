/**
 * Pure valuation formulas (deterministic, no AI)
 * @module shared/lib/valuation
 */

export interface ValuationInputs {
  // Financial metrics
  eps: number | null;
  peRatio: number | null;
  bookValuePerShare: number | null;
  roe: number | null;
  profitMargins: number | null;
  debtToEquity: number | null;
  dividendYield: number | null;
  epsGrowth: number | null;
  
  // Price data
  currentPrice: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  
  // Analyst consensus
  analystScore: number | null; // -1 to +1
  
  // User text analyses aggregates
  avgSentimentScore: number | null; // -1 to +1
  avgReliabilityScore: number | null; // 1 to 10
  analysisCount: number;
}

export interface ValuationResult {
  globalScore: number | null; // 0-100
  globalScoreLabel: string; // Strong/Moderate/Neutral/Weak
  targetPrice: number | null; // USD
  breakdown: {
    financialHealthScore: number | null; // 0-100
    analystScore: number | null; // 0-100
    textSentimentScore: number | null; // 0-100
    weights: {
      financial: number;
      analyst: number;
      text: number;
    };
    targetPriceMethods: {
      grahamNumber: number | null;
      fairPE: number | null;
      fiftyTwoWeekMid: number | null;
    };
    baseTargetPrice: number | null;
    sentimentAdjustment: number | null;
  };
}

/**
 * Graham Number: sqrt(22.5 * EPS * BookValue)
 * Conservative intrinsic value estimate
 */
function computeGrahamNumber(eps: number | null, bvps: number | null): number | null {
  if (!eps || !bvps || eps <= 0 || bvps <= 0) return null;
  return Math.sqrt(22.5 * eps * bvps);
}

/**
 * Fair P/E target: EPS * fair P/E ratio
 * Fair P/E = min(current P/E, 25) or baseline 15 adjusted by growth
 */
function computeFairPETarget(
  eps: number | null,
  peRatio: number | null,
  epsGrowth: number | null
): number | null {
  if (!eps || eps <= 0) return null;
  
  // Baseline P/E: 15 (market average)
  let fairPE = 15;
  
  // Adjust for growth if available
  if (epsGrowth !== null && epsGrowth > 0) {
    // PEG-inspired: higher growth justifies higher P/E (cap at 25)
    fairPE = Math.min(15 + epsGrowth * 0.5, 25);
  }
  
  // Use current P/E if lower (conservative)
  if (peRatio !== null && peRatio > 0) {
    fairPE = Math.min(fairPE, peRatio);
  }
  
  return eps * fairPE;
}

/**
 * 52-week midpoint: simple mean of high and low
 */
function computeFiftyTwoWeekMid(high: number | null, low: number | null): number | null {
  if (!high || !low || high <= 0 || low <= 0) return null;
  return (high + low) / 2;
}

/**
 * Financial health score (0-100) from available metrics
 * Considers P/E (ideal 10-25), profit margin, ROE, debt/equity, dividend yield
 */
function computeFinancialHealthScore(inputs: ValuationInputs): number | null {
  const scores: number[] = [];
  
  // P/E score: optimal range 10-25, linear penalty outside
  if (inputs.peRatio !== null && inputs.peRatio > 0) {
    let peScore = 100;
    if (inputs.peRatio < 10) {
      peScore = 50 + (inputs.peRatio / 10) * 50; // Low P/E: 50-100
    } else if (inputs.peRatio <= 25) {
      peScore = 100; // Ideal range
    } else {
      peScore = Math.max(0, 100 - (inputs.peRatio - 25) * 2); // High P/E penalty
    }
    scores.push(peScore);
  }
  
  // Profit margin score: >20% excellent, 10-20% good, <10% poor
  if (inputs.profitMargins !== null) {
    const marginPct = inputs.profitMargins * 100;
    const marginScore = marginPct >= 20 ? 100 
                      : marginPct >= 10 ? 50 + (marginPct - 10) * 5
                      : marginPct * 5;
    scores.push(Math.max(0, Math.min(100, marginScore)));
  }
  
  // ROE score: >15% excellent, 10-15% good, <10% poor
  if (inputs.roe !== null) {
    const roeScore = inputs.roe >= 15 ? 100
                   : inputs.roe >= 10 ? 50 + (inputs.roe - 10) * 10
                   : inputs.roe * 5;
    scores.push(Math.max(0, Math.min(100, roeScore)));
  }
  
  // Debt/Equity score: <0.5 excellent, 0.5-1.5 good, >1.5 poor (inverted)
  if (inputs.debtToEquity !== null) {
    const deScore = inputs.debtToEquity <= 0.5 ? 100
                  : inputs.debtToEquity <= 1.5 ? 100 - (inputs.debtToEquity - 0.5) * 50
                  : Math.max(0, 50 - (inputs.debtToEquity - 1.5) * 20);
    scores.push(Math.max(0, Math.min(100, deScore)));
  }
  
  // Dividend yield score: 2-4% ideal, bonus for higher
  if (inputs.dividendYield !== null) {
    const yieldPct = inputs.dividendYield * 100;
    const divScore = yieldPct >= 2 ? Math.min(100, 50 + yieldPct * 10) : yieldPct * 25;
    scores.push(Math.max(0, Math.min(100, divScore)));
  }
  
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Compute global valuation score (0-100)
 * Weights: financial 40%, analyst 35%, text 25%
 * Rescales weights if data is missing
 */
export function computeGlobalScore(inputs: ValuationInputs): {
  score: number | null;
  label: string;
  breakdown: ValuationResult['breakdown'];
} {
  const financialHealth = computeFinancialHealthScore(inputs);
  
  // Analyst score: convert from [-1, +1] to [0, 100]
  const analystScore = inputs.analystScore !== null 
    ? ((inputs.analystScore + 1) / 2) * 100
    : null;
  
  // Text sentiment score: convert from [-1, +1] to [0, 100], weight by reliability
  let textScore: number | null = null;
  if (inputs.avgSentimentScore !== null && inputs.analysisCount > 0) {
    const baseSentiment = ((inputs.avgSentimentScore + 1) / 2) * 100;
    // Weight by reliability (1-10 scale) and volume (diminishing returns)
    const reliabilityWeight = inputs.avgReliabilityScore !== null 
      ? inputs.avgReliabilityScore / 10 
      : 0.5;
    const volumeWeight = Math.min(1, inputs.analysisCount / 10); // Cap at 10 analyses
    textScore = baseSentiment * (0.7 + 0.3 * reliabilityWeight * volumeWeight);
  }
  
  // Weights: 40% financial, 35% analyst, 25% text
  const baseWeights = { financial: 0.40, analyst: 0.35, text: 0.25 };
  const availableScores: Array<{ score: number; weight: number }> = [];
  
  if (financialHealth !== null) availableScores.push({ score: financialHealth, weight: baseWeights.financial });
  if (analystScore !== null) availableScores.push({ score: analystScore, weight: baseWeights.analyst });
  if (textScore !== null) availableScores.push({ score: textScore, weight: baseWeights.text });
  
  if (availableScores.length === 0) {
    return {
      score: null,
      label: 'N/A',
      breakdown: {
        financialHealthScore: null,
        analystScore: null,
        textSentimentScore: null,
        weights: { financial: 0, analyst: 0, text: 0 },
        targetPriceMethods: { grahamNumber: null, fairPE: null, fiftyTwoWeekMid: null },
        baseTargetPrice: null,
        sentimentAdjustment: null,
      },
    };
  }
  
  // Rescale weights to sum to 1
  const totalWeight = availableScores.reduce((sum, s) => sum + s.weight, 0);
  const normalizedScores = availableScores.map(s => ({
    score: s.score,
    weight: s.weight / totalWeight,
  }));
  
  // Weighted average
  const globalScore = normalizedScores.reduce((sum, s) => sum + s.score * s.weight, 0);
  
  // Label
  const label = globalScore >= 75 ? 'Strong'
              : globalScore >= 60 ? 'Moderate'
              : globalScore >= 40 ? 'Neutral'
              : 'Weak';
  
  return {
    score: Math.round(globalScore),
    label,
    breakdown: {
      financialHealthScore: financialHealth,
      analystScore,
      textSentimentScore: textScore,
      weights: {
        financial: financialHealth !== null ? normalizedScores.find(s => s.score === financialHealth)?.weight ?? 0 : 0,
        analyst: analystScore !== null ? normalizedScores.find(s => s.score === analystScore)?.weight ?? 0 : 0,
        text: textScore !== null ? normalizedScores.find(s => s.score === textScore)?.weight ?? 0 : 0,
      },
      targetPriceMethods: { grahamNumber: null, fairPE: null, fiftyTwoWeekMid: null },
      baseTargetPrice: null,
      sentimentAdjustment: null,
    },
  };
}

/**
 * Compute target price (fair value estimate)
 * Methods: Graham Number, Fair P/E, 52-week midpoint
 * Sentiment adjustment: ±15% based on global score
 */
export function computeTargetPrice(
  inputs: ValuationInputs,
  globalScore: number | null
): {
  targetPrice: number | null;
  breakdown: Pick<ValuationResult['breakdown'], 'targetPriceMethods' | 'baseTargetPrice' | 'sentimentAdjustment'>;
} {
  const grahamNumber = computeGrahamNumber(inputs.eps, inputs.bookValuePerShare);
  const fairPE = computeFairPETarget(inputs.eps, inputs.peRatio, inputs.epsGrowth);
  const fiftyTwoWeekMid = computeFiftyTwoWeekMid(inputs.fiftyTwoWeekHigh, inputs.fiftyTwoWeekLow);
  
  const methods: Array<{ price: number; weight: number }> = [];
  
  // Weight methods: Graham (conservative) 35%, Fair P/E 40%, 52w mid 25%
  if (grahamNumber !== null) methods.push({ price: grahamNumber, weight: 0.35 });
  if (fairPE !== null) methods.push({ price: fairPE, weight: 0.40 });
  if (fiftyTwoWeekMid !== null) methods.push({ price: fiftyTwoWeekMid, weight: 0.25 });
  
  if (methods.length === 0) {
    return {
      targetPrice: null,
      breakdown: {
        targetPriceMethods: { grahamNumber, fairPE, fiftyTwoWeekMid },
        baseTargetPrice: null,
        sentimentAdjustment: null,
      },
    };
  }
  
  // Rescale weights
  const totalWeight = methods.reduce((sum, m) => sum + m.weight, 0);
  const baseTarget = methods.reduce((sum, m) => sum + (m.price * m.weight / totalWeight), 0);
  
  // Sentiment adjustment: ±15% based on global score (50 = neutral)
  let adjustedTarget = baseTarget;
  let adjustment: number | null = null;
  if (globalScore !== null) {
    const k = 0.15; // Max 15% adjustment
    const scoreDelta = (globalScore - 50) / 50; // -1 to +1
    adjustment = k * scoreDelta;
    adjustedTarget = baseTarget * (1 + adjustment);
  }
  
  return {
    targetPrice: Math.round(adjustedTarget * 100) / 100, // Round to cents
    breakdown: {
      targetPriceMethods: { grahamNumber, fairPE, fiftyTwoWeekMid },
      baseTargetPrice: Math.round(baseTarget * 100) / 100,
      sentimentAdjustment: adjustment !== null ? Math.round(adjustment * 10000) / 100 : null, // Percentage
    },
  };
}

/**
 * Main entry point: compute global score and target price
 */
export function computeValuation(inputs: ValuationInputs): ValuationResult {
  const scoreResult = computeGlobalScore(inputs);
  const priceResult = computeTargetPrice(inputs, scoreResult.score);
  
  return {
    globalScore: scoreResult.score,
    globalScoreLabel: scoreResult.label,
    targetPrice: priceResult.targetPrice,
    breakdown: {
      ...scoreResult.breakdown,
      ...priceResult.breakdown,
    },
  };
}
