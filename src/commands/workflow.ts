import ora from 'ora';
import chalk from 'chalk';
import { getRepoState, stageAll, stageFiles, getStagedDiff, getDiffStats, getCurrentBranch, getRemoteUrl, commit, push } from '../core/git.js';
import { loadConfig } from '../core/config.js';
import { classifyFiles } from '../utils/classification.js';
import { printRepoState, printDiffStats, printAIResponse } from '../utils/display.js';
import { promptStageChanges, promptSelectFiles, promptUseConventionalCommits, promptSelectCommitMessage, promptPushToRemote } from '../prompts/index.js';
import { generateAIContent } from '../ai/index.js';
import { DiffStats, RepoState } from '../core/types.js';

export interface WorkflowOptions {
  dryRun?: boolean;
  skipPush?: boolean;
  skipCommit?: boolean;
}

export async function runWorkflow(options: WorkflowOptions = {}): Promise<void> {
  const spinner = ora();
  const config = loadConfig();

  spinner.start('Analyzing repository state...');
  const repoState: RepoState = await getRepoState();
  spinner.stop();

  printRepoState(repoState);

  const allFiles = [...repoState.modified, ...repoState.added, ...repoState.deleted, ...repoState.untracked];
  if (allFiles.length === 0) {
    console.log(chalk.yellow('\nNo changes detected. Nothing to commit.'));
    return;
  }

  const classification = classifyFiles(allFiles);

  if (!options.dryRun) {
    const stageChoice = await promptStageChanges();

    if (stageChoice === 'all') {
      const stageSpinner = ora('Staging all files...').start();
      await stageAll();
      stageSpinner.succeed('All files staged.');
    } else if (stageChoice === 'select') {
      const selected = await promptSelectFiles(allFiles);
      const stageSpinner = ora('Staging selected files...').start();
      await stageFiles(selected);
      stageSpinner.succeed(`${selected.length} file(s) staged.`);
    } else {
      console.log(chalk.yellow('Skipped staging.'));
    }
  }

  spinner.start('Collecting diff...');
  const diff = await getStagedDiff();
  const stats: DiffStats = await getDiffStats();
  spinner.stop();

  if (!diff || diff.trim().length === 0) {
    console.log(chalk.yellow('\nNo staged changes. Nothing to commit.'));
    return;
  }

  printDiffStats(stats);

  spinner.start('Generating AI analysis...');
  try {
    const aiResponse = await generateAIContent(
      repoState,
      classification.high.concat(classification.medium),
      stats,
      diff,
    );
    spinner.stop();

    printAIResponse(aiResponse);

    if (options.dryRun) {
      console.log(chalk.cyan('\nℹ Dry run — no commit or push performed.'));
      return;
    }

    const useConventional = await promptUseConventionalCommits();
    let finalMessages = aiResponse.messages;

    if (useConventional && !config.conventionalCommits) {
      console.log(chalk.dim('Generating conventional commit messages...'));
    }

    const selectedMessage = await promptSelectCommitMessage(finalMessages);

    const commitSpinner = ora('Committing...').start();
    await commit(selectedMessage);
    commitSpinner.succeed(`Committed: ${selectedMessage}`);

    if (!options.skipCommit && !options.skipPush) {
      const remoteUrl = await getRemoteUrl();
      if (!remoteUrl) {
        console.log(chalk.dim('\n  No remote configured — skipping push.'));
      } else {
        const branch = await getCurrentBranch();
        if (branch !== 'unknown') {
          const shouldPush = await promptPushToRemote();
          if (shouldPush) {
            const pushSpinner = ora(`Pushing to origin/${branch}...`).start();
            await push(branch);
            pushSpinner.succeed('Push completed.');
          }
        }
      }
    }
  } catch (error) {
    spinner.fail('AI generation failed.');
    throw error;
  }
}
