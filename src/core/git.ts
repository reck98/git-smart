import simpleGit from 'simple-git';
import { DiffStats, RepoState } from './types.js';

const git = simpleGit();

export async function isGitRepo(): Promise<boolean> {
  try {
    await git.revparse(['--git-dir']);
    return true;
  } catch {
    return false;
  }
}

export async function gitInit(): Promise<void> {
  await git.init();
}

export async function hasGitIgnore(): Promise<boolean> {
  try {
    const files = await git.raw(['ls-files', '--others', '--exclude-standard', '.gitignore']);
    const rootFiles = await git.raw(['ls-files', '.gitignore']);
    return files.trim().length > 0 || rootFiles.trim().length > 0;
  } catch {
    return false;
  }
}

export async function getRemoteUrl(): Promise<string | null> {
  try {
    const remotes = await git.getRemotes(true);
    const origin = remotes.find(r => r.name === 'origin');
    return origin?.refs.fetch || null;
  } catch {
    return null;
  }
}

export async function addRemote(url: string): Promise<void> {
  await git.addRemote('origin', url);
}

export async function isFirstCommit(): Promise<boolean> {
  try {
    await git.revparse(['--verify', 'HEAD']);
    return false;
  } catch {
    return true;
  }
}

export async function getRepoState(): Promise<RepoState> {
  const status = await git.status();

  return {
    modified: status.modified,
    added: status.created,
    deleted: status.deleted,
    untracked: status.not_added,
  };
}

export async function stageAll(): Promise<void> {
  await git.add('.');
}

export async function stageFiles(files: string[]): Promise<void> {
  await git.add(files);
}

export async function getStagedDiff(): Promise<string> {
  try {
    const diff = await git.raw(['diff', '--cached']);
    return diff || '';
  } catch {
    return '';
  }
}

export async function getDiffStats(): Promise<DiffStats> {
  try {
    const stat = await git.raw(['diff', '--cached', '--numstat']);
    const lines = stat.trim().split('\n').filter(Boolean);

    let insertions = 0;
    let deletions = 0;

    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        insertions += parseInt(parts[0], 10) || 0;
        deletions += parseInt(parts[1], 10) || 0;
      }
    }

    const statOutput = await git.raw(['diff', '--cached', '--stat']);
    const filesMatch = statOutput.match(/(\d+) file[s]? changed/);
    const files = filesMatch ? parseInt(filesMatch[1], 10) : lines.length;

    return { files, insertions, deletions };
  } catch {
    return { files: 0, insertions: 0, deletions: 0 };
  }
}

export async function getCurrentBranch(): Promise<string> {
  try {
    return await git.revparse(['--abbrev-ref', 'HEAD']);
  } catch {
    return 'unknown';
  }
}

export async function commit(message: string): Promise<void> {
  await git.commit(message);
}

export interface LogEntry {
  hash: string;
  date: string;
  message: string;
  author: string;
}

export async function getLog(): Promise<LogEntry[]> {
  try {
    const log = await git.log({ maxCount: 50 });
    return log.all.map(entry => ({
      hash: entry.hash,
      date: entry.date,
      message: entry.message,
      author: entry.author_name,
    }));
  } catch {
    return [];
  }
}

export async function push(branch: string): Promise<void> {
  await git.push('origin', branch);
}
