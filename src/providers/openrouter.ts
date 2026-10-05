import OpenAI from 'openai';
import { AIResponse } from '../core/types.js';
import { LLMProvider } from './types.js';

export class OpenRouterProvider implements LLMProvider {
  async generateResponse(
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    model: string,
  ): Promise<AIResponse> {
    const client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/reck98/git-smart',
        'X-Title': 'git-smart',
      },
    });

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenRouter');

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in OpenRouter response');

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      summary: Array.isArray(parsed.summary)
        ? parsed.summary.map(String)
        : (typeof parsed.summary === 'string' ? [parsed.summary] : []),
      impact: (typeof parsed.impact === 'string' && ['low', 'medium', 'high'].includes(parsed.impact.toLowerCase())
        ? parsed.impact.toLowerCase()
        : 'medium') as AIResponse['impact'],
      messages: Array.isArray(parsed.messages)
        ? parsed.messages.map(String)
        : (typeof parsed.messages === 'string' ? [parsed.messages] : []),
    };
  }
}
