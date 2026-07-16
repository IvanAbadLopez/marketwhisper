export type IconKey = 
  | 'strength' 
  | 'weakness' 
  | 'financial' 
  | 'sentiment' 
  | 'outlook' 
  | 'default';

export interface ParsedBullet {
  type: 'bullet';
  iconKey: IconKey;
  text: string;
}

export interface ParsedParagraph {
  type: 'paragraph';
  text: string;
}

export type ParsedContent = ParsedBullet | ParsedParagraph;

function detectIconKey(text: string): IconKey {
  const lowerText = text.toLowerCase();
  
  if (
    lowerText.includes('financial') ||
    lowerText.includes('revenue') ||
    lowerText.includes('earnings') ||
    lowerText.includes('profit') ||
    lowerText.includes('margin') ||
    lowerText.includes('debt') ||
    lowerText.includes('cash flow') ||
    lowerText.includes('valuation') ||
    lowerText.includes('p/e')
  ) {
    return 'financial';
  }
  
  if (
    lowerText.includes('sentiment') ||
    lowerText.includes('analyst') ||
    lowerText.includes('rating') ||
    lowerText.includes('upgrade') ||
    lowerText.includes('downgrade')
  ) {
    return 'sentiment';
  }
  
  if (
    lowerText.includes('outlook') ||
    lowerText.includes('forecast') ||
    lowerText.includes('projection') ||
    lowerText.includes('future') ||
    lowerText.includes('expect')
  ) {
    return 'outlook';
  }
  
  if (
    lowerText.includes('weakness') ||
    lowerText.includes('concern') ||
    lowerText.includes('risk') ||
    lowerText.includes('challenge') ||
    lowerText.includes('threat') ||
    lowerText.includes('declining') ||
    lowerText.includes('pressure') ||
    lowerText.includes('vulnerable')
  ) {
    return 'weakness';
  }
  
  if (
    lowerText.includes('strength') ||
    lowerText.includes('advantage') ||
    lowerText.includes('positive') ||
    lowerText.includes('growth') ||
    lowerText.includes('strong') ||
    lowerText.includes('leader') ||
    lowerText.includes('expanding') ||
    lowerText.includes('opportunity') ||
    lowerText.includes('potential')
  ) {
    return 'strength';
  }
  
  return 'default';
}

function processBoldText(text: string): string {
  let cleaned = text.replace(/\*\*(.*?)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*/g, '');
  return cleaned;
}

function isBullet(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('•') ||
    trimmed.startsWith('-') ||
    trimmed.startsWith('*') ||
    /^\d+\./.test(trimmed)
  );
}

function extractBulletText(line: string): string {
  const trimmed = line.trim();
  let text = trimmed;
  
  if (text.startsWith('•') || text.startsWith('-') || text.startsWith('*')) {
    text = text.substring(1).trim();
  }
  
  if (/^\d+\./.test(text)) {
    text = text.replace(/^\d+\.\s*/, '');
  }
  
  text = processBoldText(text);
  
  const categoryPrefixes = [
    /^strengths?:?\s*/i,
    /^weaknesses?:?\s*/i,
    /^concerns?:?\s*/i,
    /^risks?:?\s*/i,
    /^key\s+(strength|weakness|concern|risk|point)s?:?\s*/i,
    /^financial\s+(health|analysis|metrics|assessment)?:?\s*/i,
    /^market\s+sentiment:?\s*/i,
    /^analyst\s+sentiment:?\s*/i,
    /^sentiment\s+synthesis:?\s*/i,
    /^sentiment:?\s*/i,
    /^(investment\s+)?outlook:?\s*/i,
    /^recommendation:?\s*/i,
    /^assessment:?\s*/i,
  ];
  
  for (const pattern of categoryPrefixes) {
    text = text.replace(pattern, '');
  }
  
  return text.trim();
}

export function parseAnalysisBullets(text: string): ParsedContent[] {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => {
      if (l.length === 0) return false;
      if (/^#{1,6}\s/.test(l)) return false;
      if (/^(\/)?[A-Z][a-z]+(\s*\/\s*[A-Z][a-z]+)*:\s*$/.test(l)) return false;
      if (/^-{3,}$/.test(l)) return false;
      if (/^SUMMARY:/i.test(l)) return false;
      return true;
    });
  const result: ParsedContent[] = [];
  
  for (const line of lines) {
    if (isBullet(line)) {
      const iconKey = detectIconKey(line);
      const bulletText = extractBulletText(line);
      
      if (bulletText && bulletText.length > 0) {
        result.push({
          type: 'bullet',
          iconKey,
          text: bulletText,
        });
      }
    } else {
      const processedText = processBoldText(line);
      
      if (processedText && processedText.length > 0) {
        result.push({
          type: 'paragraph',
          text: processedText,
        });
      }
    }
  }
  
  return result;
}

export interface VerdictSummary {
  verdict: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  risk: 'Low' | 'Medium' | 'High';
  confidence: number;
}

export function parseVerdict(text: string): VerdictSummary | null {
  if (!text || typeof text !== 'string') return null;
  
  const summaryMatch = text.match(/SUMMARY:\s*(BULLISH|BEARISH|NEUTRAL)\s*\|\s*Risk:\s*(Low|Medium|High)\s*\|\s*Confidence:\s*(\d+)\/10/i);
  
  if (!summaryMatch) return null;
  
  const verdict = summaryMatch[1].toUpperCase() as 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  const risk = summaryMatch[2] as 'Low' | 'Medium' | 'High';
  const confidence = parseInt(summaryMatch[3], 10);
  
  if (confidence < 1 || confidence > 10 || isNaN(confidence)) return null;
  
  return { verdict, risk, confidence };
}
