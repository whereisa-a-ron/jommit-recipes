import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

const REPO_ROOT = new URL('..', import.meta.url).pathname;
const RECIPES_DIR = join(REPO_ROOT, 'recipes');

function getRecipePaths() {
  if (!existsSync(RECIPES_DIR)) return [];
  const paths = [];
  for (const category of readdirSync(RECIPES_DIR)) {
    const catPath = join(RECIPES_DIR, category);
    if (!statSync(catPath).isDirectory()) continue;
    for (const slug of readdirSync(catPath)) {
      const recipePath = join(catPath, slug);
      if (!statSync(recipePath).isDirectory()) continue;
      paths.push(recipePath);
    }
  }
  return paths;
}

const allFlag = process.argv.includes('--all');
const recipeIdx = process.argv.indexOf('--recipe');
const singlePath = recipeIdx !== -1 ? process.argv[recipeIdx + 1] : null;

const recipePaths = allFlag ? getRecipePaths() : (singlePath ? [singlePath] : []);
let failed = 0;

for (const recipePath of recipePaths) {
  const rulePath = join(recipePath, 'rule.yaml');
  const eventPath = join(recipePath, 'fixture-event.json');
  console.log(`Validating ${recipePath}...`);
  const result = spawnSync('jommit', ['dry-run', '--rule', rulePath, '--event', eventPath], {
    stdio: 'inherit',
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    console.error(`  FAILED: ${recipePath}`);
    failed++;
  }
}

console.log(`\nvalidated ${recipePaths.length} recipes; ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
