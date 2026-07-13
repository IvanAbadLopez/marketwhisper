/**
 * Translation utility using Ollama
 * Translates text from English to Spanish on-demand (no persistence)
 */

import { env } from '@/shared/config/env';

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
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
