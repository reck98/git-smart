import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runConfigWizard, showConfig } from './commands/config.js';
import { runPreChecks } from './commands/prechecks.js';
import { runWorkflow } from './commands/workflow.js';
import { runSummary } from './commands/summary.js';
import { runCommit } from './commands/commit.js';
import { runPush } from './commands/push.js';
import { runHistory } from './commands/history.js';
import { isFirstRun, assertConfigured, getActiveProvider } from './core/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8')) as { version: string };

function handleError(error: unknown): void {
  const err = error as Error & { status?: number; code?: number; error?: { message: string } };
  const provider = getActiveProvider();

  console.error(chalk.red('\n  Error:'));

  if (err.status === 401 || err.code === 401) {
    const msg = err.error?.message || err.message || 'Authentication failed';
    console.error(chalk.yellow(`  ${msg}`));
    console.error(chalk.dim(`\n  Your ${provider} API key appears to be invalid.\n`));
    console.error(chalk.dim('  Run:'));
    console.error(chalk.bold('    git-smart config'));
    console.error(chalk.dim('\n  to update your API key.'));
    console.error(chalk.dim('  Or set it via environment variable:\n'));
    console.error(chalk.bold(`    GIT_SMART_${provider.toUpperCase()}_API_KEY=your-key`));
  } else if (err.message?.includes('fetch') || err.message?.includes('ENOTFOUND')) {
    console.error(chalk.yellow('  Network error. Check your internet connection.'));
  } else if (err.message?.includes('No API key')) {
    console.error(chalk.yellow(`  ${err.message}`));
  } else {
    console.error(chalk.yellow(`  ${err.message || 'An unexpected error occurred.'}`));
  }

  process.exit(1);
}

export function createCLI(): Command {
  const program = new Command();

  program
    .name('git-smart')
    .description('AI-powered Git workflow assistant')
    .version(pkg.version);

  program.showHelpAfterError();

  program
    .command('config')
    .description('Configure AI provider and API keys')
    .option('--show', 'Display current configuration')
    .option('--global', 'Save configuration globally (applies to all projects)')
    .option('--local', 'Show only local configuration (used with --show)')
    .action(async (options: { show?: boolean; global?: boolean; local?: boolean }) => {
      try {
        if (options.show) {
          await showConfig(options.global ? 'global' : options.local ? 'local' : 'merged');
          return;
        }
        await runConfigWizard(options.global);
      } catch (error) {
        handleError(error);
      }
    });

  program
    .option('--dry-run', 'Generate summary and messages without committing or pushing')
    .action(async (options: { dryRun?: boolean }) => {
      try {
        if (isFirstRun()) {
          console.log(chalk.cyan('\n  Welcome to git-smart.\n'));
          console.log('  No configuration found.\n');
          console.log('  Run:\n');
          console.log(chalk.bold('    git-smart config'));
          console.log('\n  to get started.\n');
          process.exit(1);
        }
        assertConfigured();
        await runPreChecks();
        await runWorkflow({ dryRun: options.dryRun });
      } catch (error) {
        handleError(error);
      }
    });

  program
    .command('summary')
    .description('Generate change summary only')
    .action(async () => {
      try {
        assertConfigured();
        await runPreChecks();
        await runSummary();
      } catch (error) {
        handleError(error);
      }
    });

  program
    .command('commit')
    .description('Generate commit messages and commit')
    .action(async () => {
      try {
        assertConfigured();
        await runPreChecks();
        await runCommit();
      } catch (error) {
        handleError(error);
      }
    });

  program
    .command('push')
    .description('Push current branch to remote')
    .action(async () => {
      try {
        await runPush();
      } catch (error) {
        handleError(error);
      }
    });

  program
    .command('history')
    .description('Show commit history')
    .action(async () => {
      try {
        await runHistory();
      } catch (error) {
        handleError(error);
      }
    });

  program.on('command:*', ([cmd]) => {
    console.error(chalk.red(`\n  Error: unknown command '${cmd}'.`));
    console.error(chalk.dim('\n  Available commands:\n'));
    console.error(chalk.white('    config    Configure AI provider and API keys'));
    console.error(chalk.white('    summary   Generate change summary only'));
    console.error(chalk.white('    commit    Generate commit messages and commit'));
    console.error(chalk.white('    push      Push current branch to remote'));
    console.error(chalk.white('    history   Show commit history'));
    console.error(chalk.white('    (no args) Full interactive workflow\n'));
    process.exit(1);
  });

  return program;
}
