import ora from 'ora';
import chalk from 'chalk';
import { getLog, LogEntry } from '../core/git.js';
import inquirer from 'inquirer';

export async function runHistory(): Promise<void> {
  const spinner = ora();

  spinner.start('Fetching commit history...');
  const log = await getLog();
  spinner.stop();

  if (log.length === 0) {
    console.log(chalk.yellow('\n  No commits found.'));
    return;
  }

  const { format } = await inquirer.prompt<{ format: 'oneline' | 'detailed' }>([
    {
      type: 'list',
      name: 'format',
      message: 'Display format:',
      choices: [
        { name: 'Oneline — short hash + message', value: 'oneline' },
        { name: 'Detailed — full details', value: 'detailed' },
      ],
    },
  ]);

  console.log();

  if (format === 'oneline') {
    for (const entry of log) {
      const shortHash = entry.hash.substring(0, 7);
      console.log(chalk.yellow(`  ${shortHash}`) + chalk.white(`  ${entry.message.split('\n')[0]}`));
    }
  } else {
    for (const entry of log) {
      const date = new Date(entry.date).toLocaleString();
      console.log(chalk.yellow(`  Commit: ${entry.hash}`));
      console.log(chalk.dim(`  Author: ${entry.author}`));
      console.log(chalk.dim(`  Date:   ${date}`));
      console.log(chalk.white(`\n    ${entry.message}`));
      console.log();
    }
  }
}
