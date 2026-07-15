/**
 * Parse AI analysis text into structured bullets with icon mappings
 * @module shared/lib/parseAnalysis
 */

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

/**
 * Detect icon key from bullet text based on keywords
 */
function detectIconKey(text: string): IconKey {
  const lowerText = text.toLowerCase();
  
  // Financial indicators (check first - very specific)
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
  
  // Sentiment/market indicators (specific)
  if (
    lowerText.includes('sentiment') ||
    lowerText.includes('analyst') ||
    lowerText.includes('rating') ||
    lowerText.includes('upgrade') ||
    lowerText.includes('downgrade')
  ) {
    return 'sentiment';
  }
  
  // Outlook/forecast indicators (specific)
  if (
    lowerText.includes('outlook') ||
    lowerText.includes('forecast') ||
    lowerText.includes('projection') ||
    lowerText.includes('future') ||
    lowerText.includes('expect')
  ) {
    return 'outlook';
  }
  
  // Weakness/risk indicators (negative - check before strength)
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
  
  // Strength indicators (positive - check last, more general)
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

/**
 * Process inline bold markdown (**text**) and clean up asterisks
 */
function processBoldText(text: string): string {
  // Remove bold markdown (**text**)
  let cleaned = text.replace(/\*\*(.*?)\*\*/g, '$1');
  // Remove any remaining asterisks
  cleaned = cleaned.replace(/\*/g, '');
  return cleaned;
}

/**
 * Check if line is a bullet point (•, -, *, or numbered 1.)
 */
function isBullet(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('•') ||
    trimmed.startsWith('-') ||
    trimmed.startsWith('*') ||
    /^\d+\./.test(trimmed)
  );
}

/**
 * Extract bullet text (remove marker and optional category prefix)
 */
function extractBulletText(line: string): string {
  const trimmed = line.trim();
  let text = trimmed;
  
  // Remove bullet markers
  if (text.startsWith('•') || text.startsWith('-') || text.startsWith('*')) {
    text = text.substring(1).trim();
  }
  
  // Remove numbered markers (1., 2., etc.)
  if (/^\d+\./.test(text)) {
    text = text.replace(/^\d+\.\s*/, '');
  }
  
  // Process bold text early to normalize format
  text = processBoldText(text);
  
  // Remove common category prefixes that will be redundant with section headers
  // These patterns match various ways the LLM might prefix content
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

/**
 * Parse AI analysis text into structured content
 * @param text - Raw analysis text (without VERDICT line)
 * @returns Array of parsed bullets and paragraphs
 */
export function parseAnalysisBullets(text: string): ParsedContent[] {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => {
      if (l.length === 0) return false;
      // Filter out Markdown headers (###, ####, etc.)
      if (/^#{1,6}\s/.test(l)) return false;
      // Filter out standalone category labels without content
      if (/^(\/)?[A-Z][a-z]+(\s*\/\s*[A-Z][a-z]+)*:\s*$/.test(l)) return false;
      return true;
    });
  const result: ParsedContent[] = [];
  
  for (const line of lines) {
    if (isBullet(line)) {
      // Detect icon key from original line (before removing prefixes)
      // This ensures "Outlook: ..." is detected as outlook, not as strength due to "positive"
      const iconKey = detectIconKey(line);
      const bulletText = extractBulletText(line);
      
      // Only add if there's actual content after cleaning
      if (bulletText && bulletText.length > 0) {
        result.push({
          type: 'bullet',
          iconKey,
          text: bulletText,
        });
      }
    } else {
      // Regular paragraph (fallback)
      const processedText = processBoldText(line);
      
      // Only add if there's actual content
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
