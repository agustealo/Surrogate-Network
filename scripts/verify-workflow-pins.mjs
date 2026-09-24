import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repositoryRoot = process.cwd();
const workflowDirectory = path.join(repositoryRoot, '.github', 'workflows');
const workflowFiles = (await readdir(workflowDirectory))
  .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
  .sort()
  .map((file) => path.join(workflowDirectory, file));

const failures = [];
const scannedYamlFiles = new Set();
let externalActionCount = 0;
let localActionCount = 0;
let supabaseInstallCount = 0;

function displayPath(filePath) {
  return path.relative(repositoryRoot, filePath) || filePath;
}

function stripComment(rawLine) {
  return rawLine.replace(/\s+#.*$/, '').trim();
}

function unquote(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function isGlobalSupabaseInstall(line) {
  const hasNpm = /(?:^|\s)npm(?=\s|$)/.test(line);
  const hasInstallCommand = /(?:^|\s)(?:install|i)(?=\s|$)/.test(line);
  const hasGlobalFlag = /(?:^|\s)(?:-g|--global(?:=true)?)(?=\s|$)/.test(line);
  const hasSupabasePackage = /(?:^|\s)supabase(?:@[^\s;&|]+)?(?=\s|$|[;&|])/.test(line);
  return hasNpm && hasInstallCommand && hasGlobalFlag && hasSupabasePackage;
}

function hasExactSupabaseVersion(line) {
  return /(?:^|\s)supabase@\d+\.\d+\.\d+(?=\s|$|[;&|])/.test(line);
}

async function findLocalActionManifest(target, sourceFile, lineNumber) {
  const actionDirectory = path.resolve(repositoryRoot, target);
  const rootWithSeparator = `${repositoryRoot}${path.sep}`;

  if (actionDirectory !== repositoryRoot && !actionDirectory.startsWith(rootWithSeparator)) {
    failures.push(`${displayPath(sourceFile)}:${lineNumber} local action escapes the repository root: ${target}`);
    return null;
  }

  for (const manifestName of ['action.yml', 'action.yaml']) {
    const candidate = path.join(actionDirectory, manifestName);
    try {
      await readFile(candidate, 'utf8');
      return candidate;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }

  failures.push(`${displayPath(sourceFile)}:${lineNumber} local action has no action.yml or action.yaml manifest: ${target}`);
  return null;
}

async function scanYamlFile(filePath) {
  if (scannedYamlFiles.has(filePath)) return;
  scannedYamlFiles.add(filePath);

  const source = await readFile(filePath, 'utf8');
  const lines = source.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const line = stripComment(lines[index]);
    if (!line) continue;

    const usesMatch = line.match(/^(?:-\s+)?uses:\s*(\S+)$/);
    if (usesMatch) {
      const target = unquote(usesMatch[1]);

      if (target.startsWith('./')) {
        localActionCount += 1;
        const manifest = await findLocalActionManifest(target, filePath, lineNumber);
        if (manifest) await scanYamlFile(manifest);
      } else {
        externalActionCount += 1;

        if (target.startsWith('docker://')) {
          if (!/@sha256:[0-9a-f]{64}$/i.test(target)) {
            failures.push(`${displayPath(filePath)}:${lineNumber} container action is not pinned by sha256 digest: ${target}`);
          }
        } else {
          const atIndex = target.lastIndexOf('@');
          const ref = atIndex >= 0 ? target.slice(atIndex + 1) : '';
          if (!/^[0-9a-f]{40}$/i.test(ref)) {
            failures.push(`${displayPath(filePath)}:${lineNumber} GitHub action is not pinned to a 40-character commit SHA: ${target}`);
          }
        }
      }
    }

    if (isGlobalSupabaseInstall(line)) {
      supabaseInstallCount += 1;
      if (!hasExactSupabaseVersion(line)) {
        failures.push(`${displayPath(filePath)}:${lineNumber} Supabase CLI global install is not pinned to an exact version`);
      }
    }
  }
}

for (const workflowFile of workflowFiles) {
  await scanYamlFile(workflowFile);
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

console.log(
  `Workflow dependency pins verified across ${workflowFiles.length} workflow file(s), ` +
  `${localActionCount} local action reference(s), ${externalActionCount} external action reference(s), ` +
  `and ${supabaseInstallCount} Supabase CLI install(s).`,
);
