/**
 * Background processing logic for translating analysis reasonings
 * Uses batching to translate multiple reasonings in a single Ollama call
 * @module features/analyze-text/api/processTranslation
 */

import { prisma } from "@/shared";
import { translateBatchToSpanish } from "@/shared/api/translate";

const BATCH_SIZE = 10; // Maximum number of reasonings per batch

/**
 * Process translation of analysis reasonings in the background
 * Translates reasonings in batches for efficiency
 */
export async function processTranslation(analysisIds: string[]): Promise<void> {
  try {
    console.log(`[Translation] Starting batch translation for ${analysisIds.length} analyses`);

    // Fetch all analyses that need translation
    const analyses = await prisma.analysis.findMany({
      where: {
        id: { in: analysisIds },
        reasoningEs: null, // Only translate if not already translated
      },
      select: {
        id: true,
        reasoning: true,
      },
    });

    if (analyses.length === 0) {
      console.log('[Translation] No analyses need translation (all already translated)');
      return;
    }

    // Split into batches
    const batches: typeof analyses[] = [];
    for (let i = 0; i < analyses.length; i += BATCH_SIZE) {
      batches.push(analyses.slice(i, i + BATCH_SIZE));
    }

    console.log(`[Translation] Processing ${analyses.length} analyses in ${batches.length} batch(es)`);

    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`[Translation] Translating batch ${i + 1}/${batches.length} (${batch.length} reasonings)`);

      try {
        // Extract reasonings to translate
        const reasonings = batch.map((a) => a.reasoning);

        // Translate in batch
        const translations = await translateBatchToSpanish(reasonings);

        // Update database with translations
        await Promise.all(
          batch.map((analysis, index) =>
            prisma.analysis.update({
              where: { id: analysis.id },
              data: { reasoningEs: translations[index] },
            })
          )
        );

        console.log(`[Translation] Batch ${i + 1}/${batches.length} completed successfully`);
      } catch (error) {
        console.error(`[Translation] Batch ${i + 1}/${batches.length} failed:`, error);
        // Continue with next batch even if this one fails
        // Individual analyses will remain with reasoningEs=null
      }
    }

    console.log(`[Translation] All batches processed. Total: ${analyses.length} analyses translated`);
  } catch (error: unknown) {
    console.error('[Translation] Background translation failed:', error);
    // Translations are optional, so we don't throw
    // Analyses will still be accessible with English reasoning
  }
}
