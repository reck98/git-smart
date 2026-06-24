import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIResponse } from '../core/types.js';
import { LLMProvider } from './types.js';

export class GeminiProvider implements LLMProvider {
  async generateResponse(
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    model: string,
  ): Promise<AIResponse> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });

    const result = await geminiModel.generateContent([
      { text: systemPrompt },
      { text: userPrompt },
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in Gemini response');

    return JSON.parse(jsonMatch[0]) as AIResponse;
  }
}
