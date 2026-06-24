import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GitignoreOption } from '../prompts/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TEMPLATES_DIR = join(__dirname, 'templates');

const GITIGNORE_TEMPLATES: Record<GitignoreOption, string> = {
  node: `node_modules/
dist/
build/
coverage/
.env
.env.local
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
.git-smart.json`,

  python: `__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv/
*.egg-info/
.eggs/
dist/
build/
*.egg
.git-smart.json`,

  go: `go.work
*.exe
*.exe~
*.dll
*.so
*.dylib
*.test
*.out
vendor/
.git-smart.json`,

  php: `vendor/
node_modules/
.env
*.log
.phpunit.cache
.php_cs.cache
.git-smart.json`,

  ruby: `*.gem
.bundle/
vendor/bundle
.bundled_gems
*.lock
.env
.git-smart.json`,

  rust: `target/
**/*.rs.bk
Cargo.lock
.git-smart.json`,

  java: `*.class
*.jar
*.war
*.nar
target/
!.mvn/wrapper/maven-wrapper.jar
*.log
build/
.idea/
*.iml
.settings/
.project
.classpath
.git-smart.json`,
  skip: '',
};

export function getGitignoreTemplate(option: GitignoreOption): string {
  if (option === 'skip') return '';

  const customPath = join(TEMPLATES_DIR, `${option}.gitignore`);
  if (existsSync(customPath)) {
    return readFileSync(customPath, 'utf-8');
  }

  return GITIGNORE_TEMPLATES[option] || '';
}
