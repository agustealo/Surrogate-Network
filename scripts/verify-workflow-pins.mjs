import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const workflowDirectory = path.resolve('.github', 'workflows');
const workflowFiles = (await readdir(workflowDirectory))
  .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
  .sort();

const failures = [];
let externalActionCount = 0;
let supabaseInstallCount = 0;

for (const file of workflowFiles) {
  const absolutePath = path.join(workflowDirectory, file);
  const source = await readFile(absolutePath, 'utf8');
  const lines = source.split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.replace(/\s+#.*$/, '').trim();
    if (!line) {
      return;
    }

    const usesMatch = line.match(/^uses:\s*(\S+)$/) ?? line.match(/^-\s+uses:\s*(\S+)$/);
    if (usesMatch) {
      const target = usesMatch[1];

      if (target.startsWith('./')) {
        return;
      }

      externalActionCount += 1;

      if (target.startsWith('docker://')) {
        if (!/@sha256:[0-9a-f]{64}$/i.test(target)) {
          failures.push(`${file}:${lineNumber} container action is not pinned by sha256 digest: ${target}`);
        }
        return;
      }

      const atIndex = target.lastIndexOf('@');
      const ref = atIndex >= 0 ? target.slice(atIndex + 1) : '';
      if (!/^[0-9a-f]{40}$/i.test(ref)) {
        failures.push(`${file}:${lineNumber} GitHub action is not pinned to a 40-character commit SHA: ${target}`);
      }
    }

    if (/npm\s+(?:install|i)\s+-g\s+.*\bsupabase\b/.test(line)) {
      supabaseInstallCount += 1;
      if (!/\bsupabase@\d+\.\d+\.\d+\b/.test(line)) {
        failures.push(`${file}:${lineNumber} Supabase CLI global install is not pinned to an exact version`);
      }
    }
  });
}

if (externalActionCount === 0) {
  failures.push('No external GitHub Actions references were found; workflow pin verification is not exercising the repository workflows');
}

if (supabaseInstallCount === 0) {
  failures.push('No Supabase CLI installation was found; expected CI workflow coverage is missing');
}

if (failures.length > 0) {
  console.error('Workflow dependency pin verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Workflow dependency pins verified across ${workflowFiles.length} workflow file(s), ${externalActionCount} external action reference(s), and ${supabaseInstallCount} Supabase CLI install(s).`);
