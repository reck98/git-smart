import OpenAI from 'openai';
import { AIResponse } from '../core/types.js';
import { LLMProvider } from './types.js';

export class OpenAIProvider implements LLMProvider {
  async generateResponse(
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    model: string,
  ): Promise<AIResponse> {
    const client = new OpenAI({ apiKey });

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');

    return JSON.parse(content) as AIResponse;
  }
}
