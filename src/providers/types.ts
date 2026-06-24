import { AIResponse } from '../core/types.js';

export interface LLMProvider {
  generateResponse(
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    model: string,
  ): Promise<AIResponse>;
}
