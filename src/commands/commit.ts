import ora from 'ora';
import chalk from 'chalk';
import { getRepoState, getStagedDiff, getDiffStats, stageAll, commit } from '../core/git.js';
import { classifyFiles } from '../utils/classification.js';
import { printDiffStats, printAIResponse } from '../utils/display.js';
import { promptUseConventionalCommits, promptSelectCommitMessage } from '../prompts/index.js';
import { generateAIContent } from '../ai/index.js';
import { RepoState, DiffStats } from '../core/types.js';

export async function runCommit(): Promise<void> {
  const spinner = ora();

  spinner.start('Analyzing staged changes...');
  const repoState = await getRepoState();
  const diff = await getStagedDiff();
  const stats = await getDiffStats();
  spinner.stop();

  if (!diff || diff.trim().length === 0) {
    console.log(chalk.yellow('No staged changes. Staging all...'));
    await stageAll();
    const refetchSpinner = ora('Re-collecting diff...').start();
    const newDiff = await getStagedDiff();
    const newStats = await getDiffStats();
    refetchSpinner.stop();

    if (!newDiff || newDiff.trim().length === 0) {
      console.log(chalk.yellow('No changes to commit.'));
      return;
    }

    printDiffStats(newStats);

    const allFiles = [...repoState.modified, ...repoState.added, ...repoState.deleted];
    const classification = classifyFiles(allFiles);

    spinner.start('Generating AI commit messages...');
    try {
      const aiResponse = await generateAIContent(repoState, classification.high.concat(classification.medium), newStats, newDiff);
      spinner.stop();
      printAIResponse(aiResponse);

      await promptUseConventionalCommits();
      const selectedMessage = await promptSelectCommitMessage(aiResponse.messages);

      const commitSpinner = ora('Committing...').start();
      await commit(selectedMessage);
      commitSpinner.succeed(`Committed: ${selectedMessage}`);
    } catch (error) {
      spinner.fail('AI generation failed.');
      throw error;
    }
    return;
  }

  printDiffStats(stats);

  const allFiles = [...repoState.modified, ...repoState.added, ...repoState.deleted];
  const classification = classifyFiles(allFiles);

  spinner.start('Generating AI commit messages...');
  try {
    const aiResponse = await generateAIContent(repoState, classification.high.concat(classification.medium), stats, diff);
    spinner.stop();
    printAIResponse(aiResponse);

    await promptUseConventionalCommits();
    const selectedMessage = await promptSelectCommitMessage(aiResponse.messages);

    const commitSpinner = ora('Committing...').start();
    await commit(selectedMessage);
    commitSpinner.succeed(`Committed: ${selectedMessage}`);
  } catch (error) {
    spinner.fail('AI generation failed.');
    throw error;
  }
}
