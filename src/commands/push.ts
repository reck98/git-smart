import ora from 'ora';
import chalk from 'chalk';
import { getCurrentBranch, push, getRemoteUrl } from '../core/git.js';

export async function runPush(): Promise<void> {
  const spinner = ora();

  spinner.start('Checking remote...');
  const remoteUrl = await getRemoteUrl();
  spinner.stop();

  if (!remoteUrl) {
    console.log(chalk.red('No remote repository configured.'));
    return;
  }

  spinner.start('Checking current branch...');
  const branch = await getCurrentBranch();
  spinner.stop();

  console.log(chalk.cyan(`Pushing to origin/${branch}...`));

  const pushSpinner = ora('Pushing...').start();
  try {
    await push(branch);
    pushSpinner.succeed(`Successfully pushed to origin/${branch}.`);
  } catch (error) {
    pushSpinner.fail('Push failed.');
    throw error;
  }
}
