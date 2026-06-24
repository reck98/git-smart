import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { GitSmartConfig, Provider, ConfigValidationError, ProviderKeyedConfig } from './types.js';

const DEFAULT_CONFIG: GitSmartConfig = {
  provider: 'openrouter',
  model: 'google/gemma-4-26b-a4b-it:free',
  conventionalCommits: true,
  autoPush: false,
  showSummary: true,
  providers: {},
};

export const ENV_VAR_MAP: Record<Provider, string> = {
  openai: 'GIT_SMART_OPENAI_API_KEY',
  openrouter: 'GIT_SMART_OPENROUTER_API_KEY',
  anthropic: 'GIT_SMART_ANTHROPIC_API_KEY',
  gemini: 'GIT_SMART_GEMINI_API_KEY',
};

function localConfigPath(): string {
  return join(process.cwd(), '.git-smart.json');
}

export function globalConfigPath(): string {
  const home = homedir();
  if (process.platform === 'win32') {
    return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), 'git-smart', 'config.json');
  }
  return join(home, '.config', 'git-smart', 'config.json');
}

function getProviderFromKey(provider: string): Provider {
  const key = provider.toLowerCase();
  if (['openai', 'openrouter', 'anthropic', 'gemini'].includes(key)) {
    return key as Provider;
  }
  return DEFAULT_CONFIG.provider;
}

function parseConfigFile(raw: string): GitSmartConfig | null {
  try {
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      provider: getProviderFromKey(parsed.provider || DEFAULT_CONFIG.provider),
      providers: { ...DEFAULT_CONFIG.providers, ...parsed.providers },
    };
  } catch {
    return null;
  }
}

export function loadGlobalConfig(): GitSmartConfig {
  const path = globalConfigPath();
  if (!existsSync(path)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = readFileSync(path, 'utf-8');
    const result = parseConfigFile(raw);
    return result || { ...DEFAULT_CONFIG };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveGlobalConfig(config: GitSmartConfig): void {
  const path = globalConfigPath();
  const dir = join(path, '..');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

export function loadConfig(): GitSmartConfig {
  const global = loadGlobalConfig();
  const path = localConfigPath();

  if (existsSync(path)) {
    try {
      const raw = readFileSync(path, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_CONFIG,
        ...global,
        ...parsed,
        provider: getProviderFromKey(parsed.provider || global.provider || DEFAULT_CONFIG.provider),
        providers: {
          ...DEFAULT_CONFIG.providers,
          ...global.providers,
          ...parsed.providers,
        },
      };
    } catch {
      console.warn('Warning: Could not parse .git-smart.json, using defaults.');
    }
  }

  return { ...DEFAULT_CONFIG, ...global };
}

export function loadLocalConfig(): GitSmartConfig | null {
  const path = localConfigPath();
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf-8');
    return parseConfigFile(raw);
  } catch {
    return null;
  }
}

export function saveConfig(config: GitSmartConfig): void {
  const path = localConfigPath();
  writeFileSync(path, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

export function getActiveProvider(): Provider {
  return loadConfig().provider;
}

export function getActiveModel(): string {
  return loadConfig().model;
}

export function getActiveApiKey(): string | undefined {
  const config = loadConfig();
  const envVar = ENV_VAR_MAP[config.provider];

  const envKey = process.env[envVar];
  if (envKey) return envKey;

  return config.providers?.[config.provider]?.apiKey;
}

export function getKeySource(provider: Provider): { key: string | undefined; source: 'env' | 'file' | 'none' } {
  const envVar = ENV_VAR_MAP[provider];
  const envKey = process.env[envVar];
  if (envKey) return { key: envKey, source: 'env' };

  const config = loadConfig();
  const fileKey = config.providers?.[provider]?.apiKey;
  if (fileKey) return { key: fileKey, source: 'file' };

  return { key: undefined, source: 'none' };
}

export function maskApiKey(key: string | undefined): string {
  if (!key || key.length < 8) return '****';
  return key.substring(0, 8) + '****' + key.substring(key.length - 4);
}

export function validateConfig(): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];
  const config = loadConfig();
  const hasLocal = existsSync(localConfigPath());
  const hasGlobal = existsSync(globalConfigPath());

  if (!hasLocal && !hasGlobal) {
    errors.push({ type: 'missing_config', message: 'No configuration file found.' });
    return errors;
  }

  if (!config.provider) {
    errors.push({ type: 'missing_provider', message: 'No provider specified in configuration.' });
  } else if (!['openai', 'openrouter', 'anthropic', 'gemini'].includes(config.provider)) {
    errors.push({ type: 'invalid_provider', message: `Invalid provider: "${config.provider}".` });
  }

  if (!config.model) {
    errors.push({ type: 'missing_model', message: 'No model specified in configuration.' });
  }

  const apiKey = getActiveApiKey();
  if (!apiKey) {
    const provider = config.provider || 'openrouter';
    const envVar = ENV_VAR_MAP[provider];
    errors.push({
      type: 'missing_api_key',
      message: `No API key found for "${provider}". Set ${envVar} or add it via "git-smart config".`,
    });
  }

  return errors;
}

export function assertConfigured(): void {
  const errors = validateConfig();
  if (errors.length === 0) return;

  console.log('git-smart is not configured.\n');
  console.log('Run:\n');
  console.log('  git-smart config\n');
  console.log('to configure your AI provider.');
  process.exit(1);
}

export function isFirstRun(): boolean {
  return !existsSync(localConfigPath()) && !existsSync(globalConfigPath());
}
