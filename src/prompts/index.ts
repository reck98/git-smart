import inquirer from 'inquirer';
import { Provider, PROVIDERS, GitSmartConfig } from '../core/types.js';

export async function promptInitOrExit(): Promise<'init' | 'exit'> {
  const { action } = await inquirer.prompt<{ action: 'init' | 'exit' }>([
    {
      type: 'list',
      name: 'action',
      message: 'This directory is not a Git repository.',
      choices: [
        { name: 'Initialize Repository', value: 'init' },
        { name: 'Exit', value: 'exit' },
      ],
    },
  ]);
  return action;
}

export type GitignoreOption = 'node' | 'python' | 'go' | 'php' | 'ruby' | 'rust' | 'java' | 'skip';
export type StageChoice = 'all' | 'none' | 'select';

export async function promptGitignore(): Promise<GitignoreOption> {
  const { option } = await inquirer.prompt<{ option: GitignoreOption }>([
    {
      type: 'list',
      name: 'option',
      message: 'No .gitignore file found. Generate one?',
      choices: [
        { name: 'Node', value: 'node' },
        { name: 'Python', value: 'python' },
        { name: 'Go', value: 'go' },
        { name: 'PHP', value: 'php' },
        { name: 'Ruby', value: 'ruby' },
        { name: 'Rust', value: 'rust' },
        { name: 'Java', value: 'java' },
        { name: 'Skip', value: 'skip' },
      ],
    },
  ]);
  return option;
}

export async function promptAddRemote(): Promise<'yes' | 'no'> {
  const { action } = await inquirer.prompt<{ action: 'yes' | 'no' }>([
    {
      type: 'list',
      name: 'action',
      message: 'No remote repository configured. Would you like to add one?',
      choices: [
        { name: 'Yes', value: 'yes' },
        { name: 'No', value: 'no' },
      ],
    },
  ]);
  return action;
}

export async function promptRemoteUrl(): Promise<string> {
  const { url } = await inquirer.prompt<{ url: string }>([
    {
      type: 'input',
      name: 'url',
      message: 'Remote URL:',
      validate: (input: string) => input.trim().length > 0 || 'URL cannot be empty',
    },
  ]);
  return url;
}

export async function promptStageChanges(): Promise<StageChoice> {
  const { choice } = await inquirer.prompt<{ choice: StageChoice }>([
    {
      type: 'list',
      name: 'choice',
      message: 'Stage all changes?',
      choices: [
        { name: 'Yes, stage all', value: 'all' },
        { name: 'No, skip staging', value: 'none' },
        { name: 'Select files', value: 'select' },
      ],
    },
  ]);
  return choice;
}

export async function promptSelectFiles(files: string[]): Promise<string[]> {
  const { selected } = await inquirer.prompt<{ selected: string[] }>([
    {
      type: 'checkbox',
      name: 'selected',
      message: 'Select files to stage:',
      choices: files.map(f => ({ name: f, value: f })),
      validate: (input: string[]) => input.length > 0 || 'Select at least one file',
    },
  ]);
  return selected;
}

export async function promptUseConventionalCommits(): Promise<boolean> {
  const { use } = await inquirer.prompt<{ use: boolean }>([
    {
      type: 'list',
      name: 'use',
      message: 'Use Conventional Commits?',
      choices: [
        { name: 'Yes', value: true },
        { name: 'No', value: false },
      ],
    },
  ]);
  return use;
}

export async function promptSelectCommitMessage(messages: string[]): Promise<string> {
  const choices = messages.map((msg, i) => ({
    name: `${i + 1}. ${msg}`,
    value: msg,
  }));

  choices.push({ name: 'Custom', value: '__custom__' });

  const { selected } = await inquirer.prompt<{ selected: string }>([
    {
      type: 'list',
      name: 'selected',
      message: 'Select Commit Message',
      choices,
    },
  ]);

  if (selected === '__custom__') {
    const { custom } = await inquirer.prompt<{ custom: string }>([
      {
        type: 'input',
        name: 'custom',
        message: 'Enter commit message:',
        validate: (input: string) => input.trim().length > 0 || 'Message cannot be empty',
      },
    ]);
    return custom;
  }

  return selected;
}

export async function promptPushToRemote(): Promise<boolean> {
  const { push } = await inquirer.prompt<{ push: boolean }>([
    {
      type: 'list',
      name: 'push',
      message: 'Push to remote?',
      choices: [
        { name: 'Yes', value: true },
        { name: 'No', value: false },
      ],
    },
  ]);
  return push;
}

export interface ConfigWizardAnswers {
  provider: Provider;
  model: string;
  apiKey: string;
  configureMore: boolean;
}

export async function promptConfigWizard(): Promise<ConfigWizardAnswers> {
  const { provider } = await inquirer.prompt<{ provider: Provider }>([
    {
      type: 'list',
      name: 'provider',
      message: 'Select AI provider:',
      default: 'openrouter',
      choices: [
        { name: 'OpenRouter', value: 'openrouter' },
        { name: 'OpenAI', value: 'openai' },
        { name: 'Anthropic', value: 'anthropic' },
        { name: 'Gemini', value: 'gemini' },
      ],
    },
  ]);

  const { model } = await inquirer.prompt<{ model: string }>([
    {
      type: 'input',
      name: 'model',
      message: 'Enter model name:',
      default: 'google/gemma-4-26b-a4b-it:free',
    },
  ]);

  const { apiKey } = await inquirer.prompt<{ apiKey: string }>([
    {
      type: 'password',
      name: 'apiKey',
      message: `Enter API key for ${provider}:`,
      mask: '*',
    },
  ]);

  const { configureMore } = await inquirer.prompt<{ configureMore: boolean }>([
    {
      type: 'confirm',
      name: 'configureMore',
      message: 'Configure additional providers?',
      default: false,
    },
  ]);

  return { provider, model, apiKey, configureMore };
}

export async function promptAdditionalProviderKey(provider: Provider): Promise<string> {
  const { apiKey } = await inquirer.prompt<{ apiKey: string }>([
    {
      type: 'password',
      name: 'apiKey',
      message: `Enter API key for ${provider} (leave empty to skip):`,
      mask: '*',
    },
  ]);
  return apiKey;
}

export async function promptUseGlobalConfig(globalConfig: GitSmartConfig): Promise<'use' | 'fresh'> {
  const configuredProviders = Object.entries(globalConfig.providers)
    .filter(([, v]) => v.apiKey);

  const { action } = await inquirer.prompt<{ action: 'use' | 'fresh' }>([
    {
      type: 'list',
      name: 'action',
      message: 'Global config found. Use it as starting point for local config?',
      choices: [
        {
          name: `Use global config (provider: ${globalConfig.provider}, model: ${globalConfig.model})`,
          value: 'use',
        },
        { name: 'Start fresh', value: 'fresh' },
      ],
    },
  ]);
  return action;
}
