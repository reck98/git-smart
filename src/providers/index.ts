import { Provider } from '../core/types.js';
import { LLMProvider } from './types.js';
import { OpenAIProvider } from './openai.js';
import { OpenRouterProvider } from './openrouter.js';
import { AnthropicProvider } from './anthropic.js';
import { GeminiProvider } from './gemini.js';

export function getProvider(provider: Provider): LLMProvider {
  const providers: Record<Provider, () => LLMProvider> = {
    openai: () => new OpenAIProvider(),
    openrouter: () => new OpenRouterProvider(),
    anthropic: () => new AnthropicProvider(),
    gemini: () => new GeminiProvider(),
  };

  const factory = providers[provider];
  if (!factory) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  return factory();
}
