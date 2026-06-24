# git-smart &nbsp;[![npm version](https://img.shields.io/npm/v/@reck98/git-smart.svg)](https://www.npmjs.com/package/@reck98/git-smart) [![npm downloads](https://img.shields.io/npm/dm/@reck98/git-smart.svg)](https://www.npmjs.com/package/@reck98/git-smart) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)

AI-powered Git workflow assistant that generates production-quality commit messages, summarizes code changes, and streamlines Git operations.

```bash
npm install -g @reck98/git-smart@1.1.0
```

---

## Features

- **Repository Validation** — Detects if the current directory is a Git repo; offers to initialize one.
- **.gitignore Generator** — Detects missing `.gitignore` and offers templates for Node, Python, Go, PHP, Ruby, Rust, Java. Automatically adds `.git-smart.json` to all templates and existing `.gitignore` files.
- **Remote Validation** — Detects missing remotes; prompts to add one interactively.
- **First Commit Detection** — Adapts behavior for repositories without a commit history.
- **Smart Staging** — Stage all, none, or select files interactively.
- **AI Change Summary** — Generates a concise bullet-point summary of what changed.
- **Commit Message Generation** — Produces three production-grade commit message options via LLM.
- **Conventional Commits** — Supports `feat:`, `fix:`, `refactor:`, etc.
- **Custom Editing** — Pick a generated message or write your own.
- **Push Workflow** — Optionally push to remote after committing.
- **Multi-Provider LLM** — OpenAI, OpenRouter, Anthropic, and Gemini.
- **Global & Local Config** — Set defaults once globally, override per project. Local config overrides global config.
- **Enhanced Config Display** — `config --show` displays file locations, env var status, API key sources, and repository info.

---

## Quick Start

```bash
# Install globally
npm install -g @reck98/git-smart@1.1.0

# Run the config wizard (required before first use)
git-smart config

# Run the full workflow
git-smart
```

---

## Commands

| Command | Description |
|---|---|
| `git-smart config` | Interactive configuration wizard for AI provider and API keys |
| `git-smart config --global` | Save configuration globally (applies to all projects) |
| `git-smart config --show` | Display merged configuration with file locations, env vars, and repo info |
| `git-smart config --show --global` | Show only global configuration |
| `git-smart config --show --local` | Show only local configuration |
| `git-smart` | Full workflow: prechecks → stage → AI summary → commit → push |
| `git-smart --dry-run` | Generate summary and messages; no commit or push |
| `git-smart summary` | Generate change summary only |
| `git-smart commit` | Generate commit messages and commit (no push) |
| `git-smart push` | Push current branch to remote |
| `git-smart history` | Show commit history |

---

## Workflow

```
START
  ↓
Configuration Gate (must be configured)
  ↓
Validate Repository
  ↓
Validate .gitignore
  ↓
Validate Remote
  ↓
Detect First Commit
  ↓
Analyze Repository State
  ↓
Stage Files
  ↓
Collect Diff
  ↓
Generate AI Summary
  ↓
Generate Commit Messages
  ↓
Select / Edit Message
  ↓
Commit
  ↓
Push (optional)
  ↓
END
```

---

## Installation

### Global (recommended)

```bash
npm install -g @reck98/git-smart@1.1.0
```

### npx (no install)

```bash
npx @reck98/git-smart@1.1.0
```

### From source

```bash
git clone <repo-url>
cd git-smart
npm install
npm run build
npm link
```

---

## First Run

```bash
git-smart
```

If no configuration is found:

```
Welcome to git-smart.

No configuration found.

Run:

  git-smart config

to get started.
```

---

## Configuration

### Config Locations

git-smart supports two configuration levels:

| Level | Location | Purpose |
|---|---|---|
| **Global** | `~/.config/git-smart/config.json` (Linux/macOS) or `%APPDATA%/git-smart/config.json` (Windows) | Default settings for all projects |
| **Local** | `./.git-smart.json` (project root) | Per-project overrides |

**Priority order:** Local config → Global config → Defaults

Local config overrides global config. Global config overrides built-in defaults.

### Config Wizard

Run the interactive wizard:

```bash
git-smart config
```

It will guide you through:
1. Selecting an AI provider (OpenRouter, OpenAI, Anthropic, Gemini)
2. Setting the model name
3. Entering your API key (masked input)
4. Optionally configuring additional providers

If a global config exists, the wizard will offer to copy its values to local config as a starting point.

### Global Configuration

Set defaults once, use everywhere:

```bash
# Save configuration globally
git-smart config --global
```

This creates a global config at `~/.config/git-smart/config.json`. When you run `git-smart config` in any project, you'll be prompted to use the global config as a starting point.

### Manual Configuration

Create `.git-smart.json` in your project root:

```json
{
  "provider": "openrouter",
  "model": "google/gemma-4-26b-a4b-it:free",
  "conventionalCommits": true,
  "autoPush": false,
  "showSummary": true,
  "providers": {
    "openrouter": {
      "apiKey": "sk-or-v1-..."
    },
    "openai": {
      "apiKey": "sk-..."
    }
  }
}
```

| Option | Default | Description |
|---|---|---|
| `provider` | `openrouter` | Active LLM provider |
| `model` | `google/gemma-4-26b-a4b-it:free` | Model name for the active provider |
| `conventionalCommits` | `true` | Generate Conventional Commit messages |
| `autoPush` | `false` | Automatically push after commit |
| `showSummary` | `true` | Display AI-generated summary before committing |
| `providers` | `{}` | Per-provider API key storage (allows instant switching) |

### Config Display

Show the full configuration with detailed info:

```bash
git-smart config --show
```

Output includes:
- Active provider and model settings
- Config file locations and whether they exist
- API keys (masked) with source (env var or config file)
- Environment variable status for all providers
- Repository info (remote URL, current branch)
- `.gitignore` status

```bash
git-smart config --show --global   # Show only global config
git-smart config --show --local    # Show only local config
```

### Configuration Gate

All AI-powered commands (`git-smart`, `git-smart --dry-run`, `git-smart summary`, `git-smart commit`) require a valid configuration. If missing, they will exit with a message directing you to run `git-smart config`.

---

## Environment Variables

Environment variables take **highest priority** over stored config.

| Variable | Provider |
|---|---|
| `GIT_SMART_OPENROUTER_API_KEY` | OpenRouter |
| `GIT_SMART_OPENAI_API_KEY` | OpenAI |
| `GIT_SMART_ANTHROPIC_API_KEY` | Anthropic |
| `GIT_SMART_GEMINI_API_KEY` | Gemini |

Priority order:
1. Environment variable
2. Local config (`./.git-smart.json`)
3. Global config (`~/.config/git-smart/config.json`)
4. Built-in defaults

Examples:

```bash
export GIT_SMART_OPENROUTER_API_KEY=sk-or-v1-xxxx
```

```powershell
$env:GIT_SMART_OPENROUTER_API_KEY="sk-or-v1-xxxx"
```

---

## Usage Examples

```bash
# Configure your provider and API key (local)
git-smart config

# Configure globally (applies to all projects)
git-smart config --global

# Display current configuration with full details
git-smart config --show

# Show only global config
git-smart config --show --global

# Show only local config
git-smart config --show --local

# Full interactive workflow
git-smart

# Preview without committing
git-smart --dry-run

# Only generate a summary of staged changes
git-smart summary

# Generate messages and commit (skip push prompt)
git-smart commit

# Push current branch to origin
git-smart push

# Show commit history
git-smart history
```

---

## Output Example

```
Impact: MEDIUM

Summary
  ✓ Added ApiError utility
  ✓ Added ApiResponse utility
  ✓ Added asyncHandler wrapper
  ✓ Refactored environment configuration

Suggested Commits
  1. feat(core): add reusable API utility classes
  2. refactor(config): centralize environment setup
  3. chore(project): improve backend initialization flow
```

---

## Security

- API keys are **never** displayed in full. Only the first 8 and last 4 characters are shown (e.g., `sk-or-v1-****5156`).
- API keys are **never** logged to console, debug output, or telemetry.
- `.git-smart.json` is automatically added to `.gitignore` during prechecks and in all generated `.gitignore` templates, preventing accidental commits of API keys.
- You can also use environment variables instead of storing keys in the config file.

---

## Supported Languages

The `.gitignore` generator includes templates for:

- Node
- Python
- Go
- PHP
- Ruby
- Rust
- Java

All templates automatically include `.git-smart.json` to prevent accidental API key commits. When running prechecks, `.git-smart.json` is also appended to existing `.gitignore` files if not already present.

---

## File Classification

Files are classified by importance to focus the AI on business logic:

| Priority | Patterns |
|---|---|
| High | `controllers`, `routes`, `services`, `models`, `middlewares` |
| Medium | `utils`, `configs` (and unclassified files) |
| Low | `package-lock`, `yarn.lock`, `pnpm-lock` |
| Ignored | `dist`, `build`, `coverage`, `node_modules` |

---

## Tech Stack

| Library | Purpose |
|---|---|
| [Commander.js](https://github.com/tj/commander.js) | CLI framework |
| [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) | Interactive prompts |
| [Chalk](https://github.com/chalk/chalk) | Terminal styling |
| [Ora](https://github.com/sindresorhus/ora) | Loading spinners |
| [simple-git](https://github.com/steveukx/git-js) | Git operations |
| [OpenAI SDK](https://github.com/openai/openai-node) | OpenAI & OpenRouter provider |
| [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) | Anthropic provider |
| [Google Generative AI](https://github.com/google-gemini/generative-ai-js) | Gemini provider |

---

## Requirements

- **Node.js** >= 20
- A **Git** repository (or let git-smart initialize one)
- An **API key** for your chosen LLM provider (configured via `git-smart config`)

---

## License

MIT
