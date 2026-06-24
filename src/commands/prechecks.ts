import chalk from 'chalk';
import ora from 'ora';
import { isGitRepo, gitInit, hasGitIgnore, getRemoteUrl, addRemote } from '../core/git.js';
import { promptInitOrExit, promptGitignore, promptAddRemote, promptRemoteUrl, GitignoreOption } from '../prompts/index.js';
import { getGitignoreTemplate } from '../utils/templates.js';
import { writeFileSync, readFileSync, appendFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface PreCheckResult {
  hasRemote: boolean;
  isFirstCommit: boolean;
}

export async function runPreChecks(): Promise<PreCheckResult> {
  const spinner = ora();

  spinner.start('Validating repository...');
  const repoOk = await isGitRepo();
  spinner.stop();

  if (!repoOk) {
    console.log(chalk.red('This directory is not a Git repository.'));
    const action = await promptInitOrExit();
    if (action === 'exit') process.exit(0);
    const initSpinner = ora('Initializing repository...').start();
    await gitInit();
    initSpinner.succeed('Repository initialized.');
  } else {
    console.log(chalk.green('✓ Git repository detected.'));
  }

  spinner.start('Checking .gitignore...');
  const ignoreExists = await hasGitIgnore();
  spinner.stop();

  if (!ignoreExists) {
    console.log(chalk.yellow('No .gitignore file found.'));
    const option: GitignoreOption = await promptGitignore();
    if (option !== 'skip') {
      const template = getGitignoreTemplate(option);
      if (template) {
        writeFileSync(join(process.cwd(), '.gitignore'), template, 'utf-8');
        console.log(chalk.green(`✓ .gitignore generated for ${option}.`));
      }
    }
  } else {
    console.log(chalk.green('✓ .gitignore exists.'));
  }

  spinner.start('Checking .git-smart.json in .gitignore...');
  const gitignorePath = join(process.cwd(), '.gitignore');
  let gitSmartIgnored = false;
  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, 'utf-8');
    gitSmartIgnored = content.split('\n').some(line => line.trim() === '.git-smart.json');
  }
  spinner.stop();

  if (!gitSmartIgnored) {
    const eol = existsSync(gitignorePath) ? '\n' : '';
    appendFileSync(gitignorePath, `${eol}.git-smart.json\n`, 'utf-8');
    console.log(chalk.green('✓ Added .git-smart.json to .gitignore.'));
  }

  spinner.start('Checking remote...');
  const remoteUrl = await getRemoteUrl();
  spinner.stop();

  let hasRemote = remoteUrl !== null;

  if (!hasRemote) {
    console.log(chalk.yellow('No remote repository configured.'));
    const shouldAdd = await promptAddRemote();
    if (shouldAdd === 'yes') {
      const url = await promptRemoteUrl();
      const addSpinner = ora('Adding remote...').start();
      await addRemote(url);
      addSpinner.succeed('Remote added.');
      hasRemote = true;
    }
  } else {
    console.log(chalk.green(`✓ Remote configured: ${remoteUrl}`));
  }

  spinner.start('Checking first commit...');
  let isFirstCommit = false;
  try {
    const { isFirstCommit: check } = await import('../core/git.js');
    isFirstCommit = await check();
  } catch {
    isFirstCommit = true;
  }
  spinner.stop();

  if (isFirstCommit) {
    console.log(chalk.cyan('ℹ First commit detected.'));
  }

  return { hasRemote, isFirstCommit };
}
