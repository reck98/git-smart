import { getActiveProvider, getActiveModel, getActiveApiKey } from '../core/config.js';
import { DiffStats, RepoState, AIResponse } from '../core/types.js';
import { getProvider } from '../providers/index.js';
import { buildSystemPrompt, buildUserPrompt } from './prompt.js';

export async function generateAIContent(
  repoState: RepoState,
  files: string[],
  stats: DiffStats,
  diff: string,
): Promise<AIResponse> {
  const model = getActiveModel();
  const apiKey = getActiveApiKey();

  if (!apiKey) {
    throw new Error('No API key available. Run "git-smart config" to configure one.');
  }

  const provider = getProvider(getActiveProvider());
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(repoState, files, stats, diff);

  return provider.generateResponse(systemPrompt, userPrompt, apiKey, model);
}
