export interface ProviderConfig {
  apiKey?: string;
}

export interface ProviderKeyedConfig {
  openrouter?: ProviderConfig;
  openai?: ProviderConfig;
  anthropic?: ProviderConfig;
  gemini?: ProviderConfig;
}

export interface GitSmartConfig {
  provider: 'openai' | 'openrouter' | 'anthropic' | 'gemini';
  model: string;
  conventionalCommits: boolean;
  autoPush: boolean;
  showSummary: boolean;
  providers: ProviderKeyedConfig;
}

export type ImpactLevel = 'low' | 'medium' | 'high';

export interface AIResponse {
  summary: string[];
  impact: ImpactLevel;
  messages: string[];
}

export interface DiffStats {
  files: number;
  insertions: number;
  deletions: number;
}

export interface RepoState {
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
}

export interface FileClassification {
  high: string[];
  medium: string[];
  low: string[];
  ignored: string[];
}

export type Provider = 'openai' | 'openrouter' | 'anthropic' | 'gemini';

export type ConfigValidationError =
  | { type: 'missing_config'; message: string }
  | { type: 'missing_provider'; message: string }
  | { type: 'invalid_provider'; message: string }
  | { type: 'missing_model'; message: string }
  | { type: 'missing_api_key'; message: string };

export const PROVIDERS: Provider[] = ['openai', 'openrouter', 'anthropic', 'gemini'];

export const HIGH_IMPORTANCE_PATTERNS = [
  'controllers', 'routes', 'services', 'models', 'middlewares',
];

export const MEDIUM_IMPORTANCE_PATTERNS = [
  'utils', 'configs',
];

export const LOW_IMPORTANCE_PATTERNS = [
  'package-lock', 'yarn.lock', 'pnpm-lock',
];

export const IGNORE_PATTERNS = [
  'dist', 'build', 'coverage', 'node_modules',
];
