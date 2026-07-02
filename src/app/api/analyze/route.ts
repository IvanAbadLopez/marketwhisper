import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { analyzeText, prisma } from '@/shared';

/**
 * POST /api/analyze
 * Analyze text with AI to detect multiple companies, sentiment, and reliability
 * Creates separate analysis records for each company mentioned
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { text, source } = body;

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Analyze text with Gemini AI - returns array of all companies detected
    const aiResults = await analyzeText(text);

    // Check if AI detected any companies
    if (!aiResults || aiResults.length === 0) {
      return NextResponse.json(
        { 
          error: 'No companies identified in the text. Please provide more specific information about companies or stock tickers.',
          analyses: [] 
        },
        { status: 400 }
      );
    }

    // Process each detected company
    const analyses = [];
    const companies = [];

    for (const aiResult of aiResults) {
      // Find or create company
      let company = await prisma.company.findUnique({
        where: { ticker: aiResult.ticker },
      });

      if (!company) {
        // Create new company with AI-detected data
        company = await prisma.company.create({
          data: {
            ticker: aiResult.ticker,
            name: aiResult.companyName,
            analysisCount: 0,
          },
        });
      }

      // Create analysis record
      const analysis = await prisma.analysis.create({
        data: {
          text,
          source: source || null,
          companyId: company.id,
          ticker: aiResult.ticker,
          sentiment: aiResult.sentiment,
          reliabilityScore: aiResult.reliabilityScore,
          reasoning: aiResult.reasoning,
        },
        include: {
          company: true,
        },
      });

      // Recalculate company aggregates
      await updateCompanyAggregates(company.id);

      // Fetch updated company data
      const updatedCompany = await prisma.company.findUnique({
        where: { id: company.id },
        include: {
          _count: {
            select: { analyses: true },
          },
        },
      });

      analyses.push(analysis);
      companies.push(updatedCompany);
    }

    return NextResponse.json({
      success: true,
      count: analyses.length,
      analyses,
      companies,
      message: `Successfully analyzed ${analyses.length} ${analyses.length === 1 ? 'company' : 'companies'}`,
    });
  } catch (error) {
    console.error('Analysis endpoint error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to analyze text' 
      },
      { status: 500 }
    );
  }
}

/**
 * Update company aggregate scores based on all analyses
 */
async function updateCompanyAggregates(companyId: string) {
  // Get all analyses for this company
  const analyses = await prisma.analysis.findMany({
    where: { companyId },
    select: {
      sentiment: true,
      reliabilityScore: true,
    },
  });

  if (analyses.length === 0) {
    return;
  }

  // Convert sentiment to numeric values for averaging
  const sentimentValues = analyses.map(a => {
    switch (a.sentiment) {
      case 'BULLISH': return 1;
      case 'BEARISH': return -1;
      case 'NEUTRAL': return 0;
    }
  });

  const reliabilityScores = analyses.map(a => a.reliabilityScore);

  // Calculate averages
  const avgSentimentScore = 
    sentimentValues.reduce((a: number, b: number) => a + b, 0) / sentimentValues.length;
  const avgReliabilityScore = 
    reliabilityScores.reduce((a: number, b: number) => a + b, 0) / reliabilityScores.length;

  // Update company
  await prisma.company.update({
    where: { id: companyId },
    data: {
      avgSentimentScore,
      avgReliabilityScore,
      analysisCount: analyses.length,
    },
  });
}

// Export for testing
export { updateCompanyAggregates };
