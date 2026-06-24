import chalk from 'chalk';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadConfig, saveConfig, saveGlobalConfig, loadGlobalConfig,
  loadLocalConfig, globalConfigPath, maskApiKey, getKeySource,
  ENV_VAR_MAP, isFirstRun as checkFirstRun,
} from '../core/config.js';
import { GitSmartConfig, Provider, PROVIDERS } from '../core/types.js';
import { promptConfigWizard, promptAdditionalProviderKey, promptUseGlobalConfig } from '../prompts/index.js';
import { getRemoteUrl, getCurrentBranch, isGitRepo } from '../core/git.js';

export async function runConfigWizard(global = false): Promise<void> {
  const globalExists = existsSync(globalConfigPath());
  const globalConf = loadGlobalConfig();

  if (global) {
    console.log(chalk.cyan('\n  git-smart global configuration\n'));
  } else {
    console.log(chalk.cyan('\n  git-smart configuration\n'));
  }

  let config: GitSmartConfig;

  if (!global && globalExists && !checkFirstRun()) {
    const choice = await promptUseGlobalConfig(globalConf);

    if (choice === 'use') {
      config = { ...globalConf };
      const providers: GitSmartConfig['providers'] = { ...globalConf.providers };
      config.providers = providers;

      saveConfig(config);

      console.log(chalk.green('\n  Global config copied to local config.\n'));

      for (const p of PROVIDERS) {
        const key = config.providers?.[p]?.apiKey;
        if (key) {
          console.log(chalk.dim(`  ${p}: ${maskApiKey(key)}`));
        }
      }

      console.log(chalk.dim(`\n  Active provider: ${config.provider}`));
      console.log(chalk.dim(`  Model: ${config.model}`));
      return;
    }
  }

  const existing = global ? loadGlobalConfig() : loadLocalConfig() || loadGlobalConfig();
  const { provider, model, apiKey, configureMore } = await promptConfigWizard();

  const providers: GitSmartConfig['providers'] = { ...existing.providers };

  if (apiKey) {
    providers[provider] = { ...providers[provider], apiKey };
  }

  if (configureMore) {
    for (const p of PROVIDERS) {
      if (p === provider) continue;
      const key = await promptAdditionalProviderKey(p);
      if (key) {
        providers[p] = { ...providers[p], apiKey: key };
      }
    }
  }

  config = {
    ...existing,
    provider,
    model,
    providers,
  };

  if (global) {
    saveGlobalConfig(config);
  } else {
    saveConfig(config);
  }

  const label = global ? 'Global' : 'Local';
  console.log(chalk.green(`\n  ${label} configuration saved.\n`));

  for (const p of PROVIDERS) {
    const key = config.providers?.[p]?.apiKey;
    if (key) {
      console.log(chalk.dim(`  ${p}: ${maskApiKey(key)}`));
    }
  }

  console.log(chalk.dim(`\n  Active provider: ${config.provider}`));
  console.log(chalk.dim(`  Model: ${config.model}`));
}

export async function showConfig(scope: 'merged' | 'global' | 'local' = 'merged'): Promise<void> {
  const globalPath = globalConfigPath();
  const localPath = join(process.cwd(), '.git-smart.json');
  const hasGlobal = existsSync(globalPath);
  const hasLocal = existsSync(localPath);

  const config = loadConfig();
  const globalConf = loadGlobalConfig();
  const localConf = loadLocalConfig();

  console.log(chalk.cyan('\n  git-smart configuration\n'));

  console.log(chalk.white(`  Active provider: ${config.provider}`));
  console.log(chalk.white(`  Model: ${config.model}`));
  console.log(chalk.white(`  Conventional Commits: ${config.conventionalCommits ? 'yes' : 'no'}`));
  console.log(chalk.white(`  Auto Push: ${config.autoPush ? 'yes' : 'no'}`));
  console.log(chalk.white(`  Show Summary: ${config.showSummary ? 'yes' : 'no'}`));

  console.log(chalk.cyan('\n  Config Source:'));
  const localDisplay = localPath.replace(/\\/g, '/').replace(process.cwd().replace(/\\/g, '/'), '.');
  const globalDisplay = globalPath.replace(/\\/g, '~').replace(/^~?/, '~');
  console.log(chalk.white(`    Local:  ${localDisplay} ${hasLocal ? chalk.green('✓') : chalk.red('(not found)')}`));
  console.log(chalk.white(`    Global: ${globalDisplay} ${hasGlobal ? chalk.green('✓') : chalk.red('(not found)')}`));

  if (scope === 'merged') {
    console.log(chalk.cyan('\n  Effective Config:'));
    console.log(chalk.dim('    (Local overrides global, global overrides defaults)'));
  }

  console.log(chalk.cyan('\n  API Keys:'));
  for (const p of PROVIDERS) {
    const { key, source } = getKeySource(p);
    if (key) {
      const masked = maskApiKey(key);
      const sourceLabel = source === 'env' ? 'env var' : 'config file';
      console.log(chalk.white(`    ${p.padEnd(12)} ${chalk.green(masked)} ${chalk.dim('(from ' + sourceLabel + ')')}`));
    } else {
      console.log(chalk.white(`    ${p.padEnd(12)} ${chalk.red('(not set)')}`));
    }
  }

  console.log(chalk.cyan('\n  Environment Variables:'));
  for (const p of PROVIDERS) {
    const envVar = ENV_VAR_MAP[p];
    const val = process.env[envVar];
    if (val) {
      console.log(chalk.white(`    ${envVar}: ${chalk.green('set')}`));
    } else {
      console.log(chalk.white(`    ${envVar}: ${chalk.red('not set')}`));
    }
  }

  console.log(chalk.cyan('\n  Repository Info:'));
  const repoOk = await isGitRepo();
  if (!repoOk) {
    console.log(chalk.white(`    Git repo: ${chalk.red('no')}`));
  } else {
    console.log(chalk.white(`    Git repo: ${chalk.green('yes')}`));
    const branch = await getCurrentBranch();
    console.log(chalk.white(`    Branch:   ${branch}`));
    const remote = await getRemoteUrl();
    if (remote) {
      console.log(chalk.white(`    Remote:   ${remote}`));
    } else {
      console.log(chalk.white(`    Remote:   ${chalk.red('not configured')}`));
    }
  }

  const gitignorePath = join(process.cwd(), '.gitignore');
  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, 'utf-8');
    const ignored = content.split('\n').some(line => line.trim() === '.git-smart.json');
    if (ignored) {
      console.log(chalk.white(`    .gitignore: ${chalk.green('includes .git-smart.json')}`));
    } else {
      console.log(chalk.white(`    .gitignore: ${chalk.yellow('.git-smart.json NOT ignored')}`));
    }
  }
}
