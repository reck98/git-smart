import Anthropic from '@anthropic-ai/sdk';
import { AIResponse } from '../core/types.js';
import { LLMProvider } from './types.js';

export class AnthropicProvider implements LLMProvider {
  async generateResponse(
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    model: string,
  ): Promise<AIResponse> {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    });

    const contentBlock = response.content[0];
    if (contentBlock?.type !== 'text') {
      throw new Error('No text response from Anthropic');
    }

    const text = contentBlock.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in Anthropic response');

    return JSON.parse(jsonMatch[0]) as AIResponse;
  }
}
