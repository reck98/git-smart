import { HIGH_IMPORTANCE_PATTERNS, MEDIUM_IMPORTANCE_PATTERNS, LOW_IMPORTANCE_PATTERNS, IGNORE_PATTERNS, FileClassification } from '../core/types.js';

export function classifyFiles(files: string[]): FileClassification {
  const result: FileClassification = {
    high: [],
    medium: [],
    low: [],
    ignored: [],
  };

  for (const file of files) {
    if (IGNORE_PATTERNS.some(p => file.includes(p))) {
      result.ignored.push(file);
    } else if (HIGH_IMPORTANCE_PATTERNS.some(p => file.includes(p))) {
      result.high.push(file);
    } else if (MEDIUM_IMPORTANCE_PATTERNS.some(p => file.includes(p))) {
      result.medium.push(file);
    } else if (LOW_IMPORTANCE_PATTERNS.some(p => file.includes(p))) {
      result.low.push(file);
    } else {
      result.medium.push(file);
    }
  }

  return result;
}
