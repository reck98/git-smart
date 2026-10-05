import chalk from 'chalk';
import ora from 'ora';
import { isGitRepo, gitInit, hasGitIgnore, getRemoteUrl, addRemote, isFirstCommit } from '../core/git.js';
import { promptInitOrExit, promptGitignore, promptAddRemote, promptRemoteUrl, GitignoreOption } from '../prompts/index.js';
import { getGitignoreTemplate } from '../utils/templates.js';
import { writeFileSync, readFileSync, appendFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface PreCheckResult {
  hasRemote: boolean;
  isFirstCommit: boolean;
}

export function detectProjectEnvironment(): GitignoreOption {
  const cwd = process.cwd();
  if (existsSync(join(cwd, 'package.json'))) return 'node';
  if (
    existsSync(join(cwd, 'requirements.txt')) ||
    existsSync(join(cwd, 'pyproject.toml')) ||
    existsSync(join(cwd, 'Pipfile')) ||
    existsSync(join(cwd, 'setup.py'))
  ) {
    return 'python';
  }
  if (
    existsSync(join(cwd, 'pom.xml')) ||
    existsSync(join(cwd, 'build.gradle')) ||
    existsSync(join(cwd, 'build.gradle.kts'))
  ) {
    return 'java';
  }
  if (existsSync(join(cwd, 'go.mod'))) return 'go';
  if (existsSync(join(cwd, 'Cargo.toml'))) return 'rust';
  if (existsSync(join(cwd, 'composer.json'))) return 'php';
  if (existsSync(join(cwd, 'Gemfile'))) return 'ruby';
  return 'node';
}

export async function ensureGitIgnore(): Promise<void> {
  const gitignorePath = join(process.cwd(), '.gitignore');
  const ignoreExists = await hasGitIgnore();

  if (!ignoreExists) {
    console.log(chalk.yellow('\n  No .gitignore file found.'));
    const detected = detectProjectEnvironment();
    const option: GitignoreOption = await promptGitignore(detected);
    if (option !== 'skip') {
      const template = getGitignoreTemplate(option);
      if (template) {
        writeFileSync(gitignorePath, template.trim() + '\n', 'utf-8');
        console.log(chalk.green(`  ✓ .gitignore generated for ${option}.`));
      }
    }
  } else {
    console.log(chalk.green('  ✓ .gitignore exists.'));
  }

  const hasIgnoreFile = existsSync(gitignorePath);
  let gitSmartIgnored = false;
  if (hasIgnoreFile) {
    const content = readFileSync(gitignorePath, 'utf-8');
    gitSmartIgnored = content.split(/\r?\n/).some(line => line.trim() === '.git-smart.json');
  }

  if (!gitSmartIgnored) {
    let prefix = '';
    if (hasIgnoreFile) {
      const content = readFileSync(gitignorePath, 'utf-8');
      if (content.length > 0 && !content.endsWith('\n')) {
        prefix = '\n';
      }
    }
    appendFileSync(gitignorePath, `${prefix}.git-smart.json\n`, 'utf-8');
    console.log(chalk.green('  ✓ Added .git-smart.json to .gitignore.'));
  }
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
  spinner.stop();
  await ensureGitIgnore();

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
  let firstCommit = false;
  try {
    firstCommit = await isFirstCommit();
  } catch {
    firstCommit = true;
  }
  spinner.stop();

  if (firstCommit) {
    console.log(chalk.cyan('ℹ First commit detected.'));
  }

  return { hasRemote, isFirstCommit: firstCommit };
}
