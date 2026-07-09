/**
 * Translation utility using Ollama
 * Translates text from English to Spanish
 * Supports both single and batch translations
 */

import { env } from '@/shared/config/env';

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

interface BatchTranslationResponse {
  translations: string[];
}

/**
 * Translate English text to Spanish using Ollama
 * @param text - English text to translate
 * @returns Spanish translation
 */
export async function translateToSpanish(text: string): Promise<string> {
  const ollamaUrl = env.OLLAMA_URL;
  const model = 'llama3.1:8b';

  const prompt = `Translate the following English text to Spanish. 
Preserve the meaning, tone, and technical accuracy. 
Respond ONLY with the translation, no explanations or additional text.

Text to translate:
"""
${text}
"""

Translation:`;

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.3, // Lower temperature for more accurate translation
          top_p: 0.9,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data: OllamaResponse = await response.json();
    return data.response.trim();
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text if translation fails
    return text;
  }
}

/**
 * Translate multiple English texts to Spanish in a single batch
 * More efficient than individual translations when processing multiple texts
 * @param texts - Array of English texts to translate
 * @returns Array of Spanish translations (same order as input)
 */
export async function translateBatchToSpanish(texts: string[]): Promise<string[]> {
  if (texts.length === 0) {
    return [];
  }

  // If only one text, use single translation for simplicity
  if (texts.length === 1) {
    const translation = await translateToSpanish(texts[0]);
    return [translation];
  }

  const ollamaUrl = env.OLLAMA_URL;
  const model = 'llama3.1:8b';

  // Build JSON array of texts to translate
  const textsJson = JSON.stringify(texts);

  const prompt = `Translate the following array of English texts to Spanish. 
Preserve the meaning, tone, and technical accuracy for each text.
Respond ONLY with a JSON object in this exact format (no additional text):

{
  "translations": [
    "Spanish translation 1",
    "Spanish translation 2",
    ...
  ]
}

The array must have the same length and order as the input.

Texts to translate (JSON array):
${textsJson}

Response (JSON only):`;

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.3, // Lower temperature for more accurate translation
          top_p: 0.9,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data: OllamaResponse = await response.json();
    const parsed: BatchTranslationResponse = JSON.parse(data.response);

    // Validate response
    if (!parsed.translations || !Array.isArray(parsed.translations)) {
      throw new Error('Invalid batch translation response format');
    }

    if (parsed.translations.length !== texts.length) {
      console.warn(`Translation count mismatch: expected ${texts.length}, got ${parsed.translations.length}`);
      // Fallback: pad with original texts if needed
      while (parsed.translations.length < texts.length) {
        const missingIndex = parsed.translations.length;
        parsed.translations.push(texts[missingIndex]);
      }
    }

    return parsed.translations.map((t) => t.trim());
  } catch (error) {
    console.error('Batch translation error:', error);
    // Fallback: return original texts if batch translation fails
    console.warn('Falling back to original texts due to batch translation error');
    return texts;
  }
}
