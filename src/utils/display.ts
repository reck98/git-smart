import chalk from 'chalk';
import { RepoState, FileClassification, DiffStats, AIResponse } from '../core/types.js';

export function printRepoState(state: RepoState): void {
  if (state.modified.length > 0) {
    console.log(chalk.yellow('\nModified:'));
    state.modified.forEach(f => console.log(chalk.white(`  ${f}`)));
  }
  if (state.added.length > 0) {
    console.log(chalk.green('\nAdded:'));
    state.added.forEach(f => console.log(chalk.white(`  ${f}`)));
  }
  if (state.deleted.length > 0) {
    console.log(chalk.red('\nDeleted:'));
    state.deleted.forEach(f => console.log(chalk.white(`  ${f}`)));
  }
  if (state.untracked.length > 0) {
    console.log(chalk.cyan('\nUntracked:'));
    state.untracked.forEach(f => console.log(chalk.white(`  ${f}`)));
  }
}

export function printDiffStats(stats: DiffStats): void {
  console.log(chalk.dim(`\n${stats.files} file(s) changed, ${stats.insertions} insertions(+), ${stats.deletions} deletions(-)`));
}

export function printAIResponse(response: AIResponse): void {
  console.log(chalk.magenta(`\nImpact: ${response.impact.toUpperCase()}`));
  console.log(chalk.cyan('\nSummary'));
  response.summary.forEach(item => console.log(chalk.green(`  ✓ ${item}`)));

  console.log(chalk.cyan('\nSuggested Commits'));
  response.messages.forEach((msg, i) => {
    console.log(chalk.white(`  ${i + 1}. ${msg}`));
  });
}
