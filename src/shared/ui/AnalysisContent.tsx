/**
 * Analysis Content Display
 * Renders AI analysis with structured bullets and icons, grouped by section
 * @module shared/ui
 */

import { 
  TrendingUp, 
  AlertTriangle, 
  BarChart3, 
  Activity, 
  Target,
  CircleDot,
  Shield,
  Award
} from "lucide-react";
import { parseAnalysisBullets, parseVerdict, type ParsedContent, type ParsedBullet, type IconKey } from "@/shared/lib/parseAnalysis";

interface IconConfig {
  Component: typeof TrendingUp;
  colorClass: string;
  headerClass: string;
  label: string;
}

const iconMap: Record<IconKey, IconConfig> = {
  strength: { 
    Component: TrendingUp, 
    colorClass: "text-green-400",
    headerClass: "text-green-300 border-green-500/30",
    label: "Key Strengths"
  },
  weakness: { 
    Component: AlertTriangle, 
    colorClass: "text-red-400",
    headerClass: "text-red-300 border-red-500/30",
    label: "Concerns & Risks"
  },
  financial: { 
    Component: BarChart3, 
    colorClass: "text-blue-400",
    headerClass: "text-blue-300 border-blue-500/30",
    label: "Financial Analysis"
  },
  sentiment: { 
    Component: Activity, 
    colorClass: "text-purple-400",
    headerClass: "text-purple-300 border-purple-500/30",
    label: "Market Sentiment"
  },
  outlook: { 
    Component: Target, 
    colorClass: "text-cyan-400",
    headerClass: "text-cyan-300 border-cyan-500/30",
    label: "Investment Outlook"
  },
  default: { 
    Component: CircleDot, 
    colorClass: "text-zinc-400",
    headerClass: "text-zinc-300 border-zinc-500/30",
    label: "Additional Notes"
  },
};

// Logical order for sections
const sectionOrder: IconKey[] = ['strength', 'financial', 'sentiment', 'outlook', 'weakness', 'default'];

interface AnalysisContentProps {
  text: string | null | undefined;
  className?: string;
  collapsed?: boolean;
}

/**
 * Group bullets by icon key
 */
function groupBulletsBySection(items: ParsedContent[]): Map<IconKey, ParsedBullet[]> {
  const groups = new Map<IconKey, ParsedBullet[]>();
  
  for (const item of items) {
    if (item.type === 'bullet') {
      const existing = groups.get(item.iconKey) || [];
      existing.push(item);
      groups.set(item.iconKey, existing);
    }
  }
  
  return groups;
}

/**
 * Render structured analysis content with icons, grouped by section
 */
export function AnalysisContent({ text, className = "", collapsed = false }: AnalysisContentProps) {
  if (!text) {
    return (
      <p className={`text-sm text-zinc-400 italic ${className}`}>
        No analysis available.
      </p>
    );
  }

  // Parse verdict summary (if present)
  const verdict = parseVerdict(text);
  
  // Remove SUMMARY line and separator from text before parsing bullets
  // Match: optional ---, optional whitespace/newlines, SUMMARY: and everything until end of line
  const cleanText = text
    .replace(/---\s*[\r\n]+\s*SUMMARY:[^\n]*/gi, '')
    .replace(/^\s*SUMMARY:[^\n]*/gim, '')
    .replace(/---\s*$/gm, '')
    .trim();
  
  const parsed = parseAnalysisBullets(cleanText);

  // Fallback: if no structured content, show as clean paragraph
  if (parsed.length === 0) {
    return (
      <p className={`text-sm text-zinc-300 whitespace-pre-wrap ${className}`}>
        {text}
      </p>
    );
  }

  // Separate bullets from paragraphs
  const bullets = parsed.filter(item => item.type === 'bullet') as ParsedBullet[];
  const paragraphs = parsed.filter(item => item.type === 'paragraph');

  // If no bullets, just show paragraphs
  if (bullets.length === 0) {
    return (
      <div className={`space-y-3 ${className}`}>
        {paragraphs.map((item, idx) => (
          <p key={idx} className="text-sm text-zinc-300 leading-relaxed">
            {item.text}
          </p>
        ))}
      </div>
    );
  }

  // Group bullets by section
  const grouped = groupBulletsBySection(parsed);

  return (
    <div className={`space-y-5 ${className} ${collapsed ? 'max-h-48 overflow-hidden relative' : ''}`}>
      {/* Verdict Summary Badges */}
      {verdict && (
        <div className="flex flex-wrap gap-2 pb-3 border-b border-zinc-700/50">
          {/* Verdict Badge */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            verdict.verdict === 'BULLISH' 
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : verdict.verdict === 'BEARISH'
              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
          }`}>
            <Target className="h-3.5 w-3.5" />
            <span>{verdict.verdict}</span>
          </div>
          
          {/* Risk Badge */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            verdict.risk === 'Low'
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : verdict.risk === 'High'
              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            <Shield className="h-3.5 w-3.5" />
            <span>Risk: {verdict.risk}</span>
          </div>
          
          {/* Confidence Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Award className="h-3.5 w-3.5" />
            <span>Confidence: {verdict.confidence}/10</span>
          </div>
        </div>
      )}

      {/* Render sections in logical order */}
      {sectionOrder.map(sectionKey => {
        const sectionBullets = grouped.get(sectionKey);
        
        // Filter out empty bullets
        const validBullets = sectionBullets?.filter(b => b.text && b.text.trim().length > 0);
        
        if (!validBullets || validBullets.length === 0) return null;

        const { Component: Icon, colorClass, headerClass, label } = iconMap[sectionKey];

        return (
          <div key={sectionKey} className="space-y-2">
            {/* Section Header */}
            <div className={`flex items-center gap-2 pb-1.5 border-b ${headerClass}`}>
              <Icon className={`h-4 w-4 ${colorClass}`} />
              <h4 className="text-xs font-semibold uppercase tracking-wide">
                {label}
              </h4>
            </div>

            {/* Section Bullets */}
            <div className="space-y-2 pl-4">
              {validBullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="text-zinc-500 text-xs mt-0.5 select-none">•</span>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {bullet.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Paragraphs at the end if any */}
      {paragraphs.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-zinc-700/50">
          {paragraphs
            .filter(p => p.text && p.text.trim().length > 0)
            .map((item, idx) => (
              <p key={idx} className="text-sm text-zinc-300 leading-relaxed italic">
                {item.text}
              </p>
            ))}
        </div>
      )}
      
      {/* Fade gradient when collapsed */}
      {collapsed && (
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-purple-900/40 via-purple-900/20 to-transparent pointer-events-none" />
      )}
    </div>
  );
}
