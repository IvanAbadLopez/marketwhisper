export interface ValuationInputs {
  eps: number | null;
  peRatio: number | null;
  bookValuePerShare: number | null;
  roe: number | null;
  profitMargins: number | null;
  debtToEquity: number | null;
  dividendYield: number | null;
  epsGrowth: number | null;
  
  currentPrice: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  
  analystScore: number | null;
  
  avgSentimentScore: number | null;
  avgReliabilityScore: number | null;
  analysisCount: number;
}

export interface ValuationResult {
  globalScore: number | null;
  globalScoreLabel: string;
  targetPrice: number | null;
  breakdown: {
    financialHealthScore: number | null;
    analystScore: number | null;
    textSentimentScore: number | null;
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

function computeGrahamNumber(eps: number | null, bvps: number | null): number | null {
  if (!eps || !bvps || eps <= 0 || bvps <= 0) return null;
  return Math.sqrt(22.5 * eps * bvps);
}

function computeFairPETarget(
  eps: number | null,
  peRatio: number | null,
  epsGrowth: number | null
): number | null {
  if (!eps || eps <= 0) return null;
  
  let fairPE = 15;
  
  if (epsGrowth !== null && epsGrowth > 0) {
    const growthPct = epsGrowth * 100;
    fairPE = Math.min(15 + growthPct * 0.5, 25);
  }
  
  if (peRatio !== null && peRatio > 0) {
    fairPE = Math.min(fairPE, peRatio);
  }
  
  return eps * fairPE;
}

function computeFiftyTwoWeekMid(high: number | null, low: number | null): number | null {
  if (!high || !low || high <= 0 || low <= 0) return null;
  return (high + low) / 2;
}

function computeFinancialHealthScore(inputs: ValuationInputs): number | null {
  const scores: number[] = [];
  
  if (inputs.peRatio !== null && inputs.peRatio > 0) {
    let peScore = 100;
    if (inputs.peRatio < 10) {
      peScore = 50 + (inputs.peRatio / 10) * 50;
    } else if (inputs.peRatio <= 25) {
      peScore = 100;
    } else {
      peScore = Math.max(0, 100 - (inputs.peRatio - 25) * 2);
    }
    scores.push(peScore);
  }
  
  if (inputs.profitMargins !== null) {
    const marginPct = inputs.profitMargins * 100;
    const marginScore = marginPct >= 20 ? 100 
                      : marginPct >= 10 ? 50 + (marginPct - 10) * 5
                      : marginPct * 5;
    scores.push(Math.max(0, Math.min(100, marginScore)));
  }
  
  if (inputs.roe !== null) {
    const roeScore = inputs.roe >= 15 ? 100
                   : inputs.roe >= 10 ? 50 + (inputs.roe - 10) * 10
                   : inputs.roe * 5;
    scores.push(Math.max(0, Math.min(100, roeScore)));
  }
  
  if (inputs.debtToEquity !== null) {
    const deScore = inputs.debtToEquity <= 0.5 ? 100
                  : inputs.debtToEquity <= 1.5 ? 100 - (inputs.debtToEquity - 0.5) * 50
                  : Math.max(0, 50 - (inputs.debtToEquity - 1.5) * 20);
    scores.push(Math.max(0, Math.min(100, deScore)));
  }
  
  if (inputs.dividendYield !== null) {
    const yieldPct = inputs.dividendYield * 100;
    const divScore = yieldPct >= 2 ? Math.min(100, 50 + yieldPct * 10) : yieldPct * 25;
    scores.push(Math.max(0, Math.min(100, divScore)));
  }
  
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export function computeGlobalScore(inputs: ValuationInputs): {
  score: number | null;
  label: string;
  breakdown: ValuationResult['breakdown'];
} {
  const financialHealth = computeFinancialHealthScore(inputs);
  
  const analystScore = inputs.analystScore !== null 
    ? ((inputs.analystScore + 1) / 2) * 100
    : null;
  
  let textScore: number | null = null;
  if (inputs.avgSentimentScore !== null && inputs.analysisCount > 0) {
    const baseSentiment = ((inputs.avgSentimentScore + 1) / 2) * 100;
    const reliabilityWeight = inputs.avgReliabilityScore !== null 
      ? inputs.avgReliabilityScore / 10 
      : 0.5;
    const volumeWeight = Math.min(1, inputs.analysisCount / 10);
    textScore = baseSentiment * (0.7 + 0.3 * reliabilityWeight * volumeWeight);
  }
  
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
  
  const totalWeight = availableScores.reduce((sum, s) => sum + s.weight, 0);
  const normalizedScores = availableScores.map(s => ({
    score: s.score,
    weight: s.weight / totalWeight,
  }));
  
  const globalScore = normalizedScores.reduce((sum, s) => sum + s.score * s.weight, 0);
  
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
  
  const totalWeight = methods.reduce((sum, m) => sum + m.weight, 0);
  const baseTarget = methods.reduce((sum, m) => sum + (m.price * m.weight / totalWeight), 0);
  
  let adjustedTarget = baseTarget;
  let adjustment: number | null = null;
  if (globalScore !== null) {
    const k = 0.15;
    const scoreDelta = (globalScore - 50) / 50;
    adjustment = k * scoreDelta;
    adjustedTarget = baseTarget * (1 + adjustment);
  }
  
  return {
    targetPrice: Math.round(adjustedTarget * 100) / 100,
    breakdown: {
      targetPriceMethods: { grahamNumber, fairPE, fiftyTwoWeekMid },
      baseTargetPrice: Math.round(baseTarget * 100) / 100,
      sentimentAdjustment: adjustment !== null ? Math.round(adjustment * 10000) / 100 : null,
    },
  };
}

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
