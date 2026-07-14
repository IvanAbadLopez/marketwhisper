/**
 * Tests for AI analysis parser
 * @module shared/lib/parseAnalysis.test
 */

import { describe, it, expect } from 'vitest';
import { parseAnalysisBullets, type ParsedContent } from './parseAnalysis';

describe('parseAnalysisBullets', () => {
  describe('bullet detection', () => {
    it('should parse bullet points with • marker', () => {
      const text = '• First point\n• Second point';
      const result = parseAnalysisBullets(text);
      
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('bullet');
      expect(result[0].text).toBe('First point');
      expect(result[1].text).toBe('Second point');
    });

    it('should parse bullet points with - marker', () => {
      const text = '- First point\n- Second point';
      const result = parseAnalysisBullets(text);
      
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('bullet');
      expect(result[0].text).toBe('First point');
    });

    it('should parse bullet points with * marker', () => {
      const text = '* First point\n* Second point';
      const result = parseAnalysisBullets(text);
      
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('bullet');
      expect(result[0].text).toBe('First point');
    });

    it('should parse numbered bullet points (1., 2., etc.)', () => {
      const text = '1. First point\n2. Second point\n3. Third point';
      const result = parseAnalysisBullets(text);
      
      expect(result).toHaveLength(3);
      expect(result[0].type).toBe('bullet');
      expect(result[0].text).toBe('First point');
      expect(result[2].text).toBe('Third point');
    });

    it('should handle mixed bullet styles', () => {
      const text = '• First\n- Second\n* Third\n1. Fourth';
      const result = parseAnalysisBullets(text);
      
      expect(result).toHaveLength(4);
      result.forEach(item => {
        expect(item.type).toBe('bullet');
      });
    });
  });

  describe('icon key detection', () => {
    it('should detect strength keywords', () => {
      const text = '• Company expanding market leadership and gaining competitive advantage';
      const result = parseAnalysisBullets(text);
      
      expect(result[0].iconKey).toBe('strength');
    });

    it('should detect weakness keywords', () => {
      const text = '• Facing significant challenges and threats from increased competition';
      const result = parseAnalysisBullets(text);
      
      expect(result[0].iconKey).toBe('weakness');
    });

    it('should detect financial keywords', () => {
      const text = '• Earnings per share increased by 15% with healthy profit margins';
      const result = parseAnalysisBullets(text);
      
      expect(result[0].iconKey).toBe('financial');
    });

    it('should detect sentiment keywords', () => {
      const text = '• Analyst ratings improved with multiple upgrades this quarter';
      const result = parseAnalysisBullets(text);
      
      expect(result[0].iconKey).toBe('sentiment');
    });

    it('should detect outlook keywords', () => {
      const text = '• Future projections indicate expected expansion';
      const result = parseAnalysisBullets(text);
      
      expect(result[0].iconKey).toBe('outlook');
    });

    it('should default to "default" icon for generic text', () => {
      const text = '• This is a generic statement about the company';
      const result = parseAnalysisBullets(text);
      
      expect(result[0].iconKey).toBe('default');
    });

    it('should prioritize specific categories (sentiment, outlook) over general ones', () => {
      const text = '• Strong analyst sentiment despite market volatility';
      const result = parseAnalysisBullets(text);
      
      // "analyst sentiment" should trigger sentiment before "strong" triggers strength
      expect(result[0].iconKey).toBe('sentiment');
    });

    it('should prioritize financial keywords when mixed with sentiment', () => {
      const text = '• Strong revenue growth of 25% year over year';
      const result = parseAnalysisBullets(text);
      
      // "revenue" is more specific to financial than "strong" is to strength
      expect(result[0].iconKey).toBe('financial');
    });
  });

  describe('bold text processing', () => {
    it('should process **bold** markdown', () => {
      const text = '• This is **important** text';
      const result = parseAnalysisBullets(text);
      
      expect(result[0].text).toBe('This is important text');
      expect(result[0].text).not.toContain('**');
    });

    it('should process multiple bold sections', () => {
      const text = '• **First** bold and **second** bold';
      const result = parseAnalysisBullets(text);
      
      expect(result[0].text).toBe('First bold and second bold');
    });

    it('should handle text without bold', () => {
      const text = '• Plain text without formatting';
      const result = parseAnalysisBullets(text);
      
      expect(result[0].text).toBe('Plain text without formatting');
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty string', () => {
      const result = parseAnalysisBullets('');
      expect(result).toEqual([]);
    });

    it('should return empty array for null', () => {
      const result = parseAnalysisBullets(null as any);
      expect(result).toEqual([]);
    });

    it('should return empty array for undefined', () => {
      const result = parseAnalysisBullets(undefined as any);
      expect(result).toEqual([]);
    });

    it('should skip empty lines', () => {
      const text = '• First\n\n\n• Second';
      const result = parseAnalysisBullets(text);
      
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('First');
      expect(result[1].text).toBe('Second');
    });

    it('should handle text with only whitespace lines', () => {
      const text = '   \n\n   \n';
      const result = parseAnalysisBullets(text);
      
      expect(result).toEqual([]);
    });

    it('should trim whitespace around bullets', () => {
      const text = '  •  Padded bullet  ';
      const result = parseAnalysisBullets(text);
      
      expect(result[0].text).toBe('Padded bullet');
    });
  });

  describe('paragraph fallback', () => {
    it('should handle non-bullet lines as paragraphs', () => {
      const text = 'This is a regular paragraph without bullets.';
      const result = parseAnalysisBullets(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('paragraph');
      expect(result[0].text).toBe('This is a regular paragraph without bullets.');
    });

    it('should mix bullets and paragraphs', () => {
      const text = 'Introduction paragraph\n• First bullet\n• Second bullet\nConclusion paragraph';
      const result = parseAnalysisBullets(text);
      
      expect(result).toHaveLength(4);
      expect(result[0].type).toBe('paragraph');
      expect(result[1].type).toBe('bullet');
      expect(result[2].type).toBe('bullet');
      expect(result[3].type).toBe('paragraph');
    });
  });

  describe('realistic AI analysis', () => {
    it('should parse typical LLM output', () => {
      const text = `• Expanding market share with strong competitive positioning
• Financial health remains robust with manageable debt levels
• Analyst ratings improved with multiple upgrades
• Outlook remains positive for the next quarter`;
      
      const result = parseAnalysisBullets(text);
      
      expect(result).toHaveLength(4);
      expect(result[0].iconKey).toBe('strength'); // "expanding" + no financial keywords
      expect(result[1].iconKey).toBe('financial'); // "financial" + "debt"
      expect(result[2].iconKey).toBe('sentiment'); // "analyst" + "ratings"
      expect(result[3].iconKey).toBe('outlook'); // "outlook"
    });

    it('should handle analysis with bold emphasis', () => {
      const text = `• **Key advantage**: Brand leadership drives customer loyalty
• **Major concern**: Rising competitive threats`;
      
      const result = parseAnalysisBullets(text);
      
      expect(result[0].text).toBe('Key advantage: Brand leadership drives customer loyalty');
      expect(result[1].text).toBe('Major concern: Rising competitive threats');
      expect(result[0].iconKey).toBe('strength'); // "advantage" + "leadership"
      expect(result[1].iconKey).toBe('weakness'); // "concern" + "threats"
    });
  });
});
