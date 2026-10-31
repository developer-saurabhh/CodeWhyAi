import { readdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function collectTests(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectTests(fullPath));
    else if (/\.test\.(ts|tsx|js|mjs|cjs)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

const tests = collectTests(path.resolve('src')).sort();
if (tests.length === 0) {
  console.error('No test files were found under src/.');
  process.exit(1);
}
const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...tests], { stdio: 'inherit' });
process.exit(result.status ?? 1);
