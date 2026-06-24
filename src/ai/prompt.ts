import { DiffStats, RepoState } from '../core/types.js';

export function buildSystemPrompt(): string {
  return `You are a senior software engineer reviewing code before commit.

Analyze the provided git diff.

Requirements:
- Understand intent
- Ignore formatting-only changes
- Ignore lock file noise
- Focus on business logic
- Follow Conventional Commits when requested
- Generate concise production-grade commit messages

Return JSON only.

Schema:
{
  "summary": ["item1", "item2"],
  "impact": "low|medium|high",
  "messages": ["message1", "message2", "message3"]
}`;
}

export function buildUserPrompt(
  repoState: RepoState,
  files: string[],
  stats: DiffStats,
  diff: string,
): string {
  return `Repository Context:

Modified files: ${repoState.modified.join(', ') || 'none'}
Added files: ${repoState.added.join(', ') || 'none'}
Deleted files: ${repoState.deleted.join(', ') || 'none'}
Untracked files: ${repoState.untracked.join(', ') || 'none'}

Files Changed:
${files.join('\n')}

Diff Statistics:
- Files changed: ${stats.files}
- Insertions: ${stats.insertions}
- Deletions: ${stats.deletions}

Git Diff:
${diff.substring(0, 15000)}

Generate:
1. Summary
2. Impact Score
3. Three commit messages`;
}
