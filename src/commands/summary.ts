import ora from 'ora';
import { getRepoState, getStagedDiff, getDiffStats } from '../core/git.js';
import { classifyFiles } from '../utils/classification.js';
import { printRepoState, printDiffStats, printAIResponse } from '../utils/display.js';
import { generateAIContent } from '../ai/index.js';
import { RepoState, DiffStats } from '../core/types.js';

export async function runSummary(): Promise<void> {
  const spinner = ora();

  spinner.start('Analyzing repository state...');
  const repoState: RepoState = await getRepoState();
  spinner.stop();

  printRepoState(repoState);

  if (repoState.modified.length === 0 && repoState.added.length === 0 && repoState.deleted.length === 0) {
    console.log('No staged changes found.');
    return;
  }

  spinner.start('Collecting diff...');
  const diff = await getStagedDiff();
  const stats: DiffStats = await getDiffStats();
  spinner.stop();

  printDiffStats(stats);

  const allFiles = [...repoState.modified, ...repoState.added, ...repoState.deleted];
  const classification = classifyFiles(allFiles);

  spinner.start('Generating AI summary...');
  try {
    const aiResponse = await generateAIContent(
      repoState,
      classification.high.concat(classification.medium),
      stats,
      diff,
    );
    spinner.stop();
    printAIResponse(aiResponse);
  } catch (error) {
    spinner.fail('AI generation failed.');
    throw error;
  }
}
