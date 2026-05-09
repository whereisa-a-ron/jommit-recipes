import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import yaml from 'js-yaml';

const REQUIRED_FILES = ['README.md', 'rule.yaml', 'fixture-event.json', 'screenshot.png'];
const REPO_ROOT = new URL('..', import.meta.url).pathname;
const RECIPES_DIR = join(REPO_ROOT, 'recipes');
const INDEX_PATH = join(REPO_ROOT, 'index.json');
const CHECK_MODE = process.argv.includes('--check');

function extractTitle(readmeContent) {
  const match = readmeContent.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

function extractSummary(readmeContent) {
  const lines = readmeContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) return trimmed;
  }
  return '';
}

function buildRecipes() {
  if (!existsSync(RECIPES_DIR)) return [];
  const recipes = [];
  for (const category of readdirSync(RECIPES_DIR)) {
    const catPath = join(RECIPES_DIR, category);
    if (!statSync(catPath).isDirectory()) continue;
    for (const slug of readdirSync(catPath)) {
      const recipePath = join(catPath, slug);
      if (!statSync(recipePath).isDirectory()) continue;
      for (const required of REQUIRED_FILES) {
        if (!existsSync(join(recipePath, required))) {
          console.error(`Missing ${required} in ${recipePath}`);
          process.exit(1);
        }
      }
      const readmeContent = readFileSync(join(recipePath, 'README.md'), 'utf8');
      const ruleYaml = yaml.load(readFileSync(join(recipePath, 'rule.yaml'), 'utf8'));
      const executorTypes = (ruleYaml?.automations ?? [])
        .flatMap(a => a.executor?.type ? [a.executor.type] : []);
      const name = ruleYaml?.automations?.[0]?.name ?? extractTitle(readmeContent);
      recipes.push({
        category,
        slug,
        name,
        summary: extractSummary(readmeContent),
        executorTypes: [...new Set(executorTypes)],
        ymlPath: `recipes/${category}/${slug}/rule.yaml`,
        screenshotPath: `recipes/${category}/${slug}/screenshot.png`,
      });
    }
  }
  return recipes;
}

const newIndex = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  recipes: buildRecipes(),
};

if (CHECK_MODE) {
  if (!existsSync(INDEX_PATH)) { console.error('index.json missing'); process.exit(1); }
  const existing = JSON.parse(readFileSync(INDEX_PATH, 'utf8'));
  const existingNoDate = { ...existing, generatedAt: '' };
  const newNoDate = { ...newIndex, generatedAt: '' };
  if (JSON.stringify(existingNoDate) !== JSON.stringify(newNoDate)) {
    console.error('index.json is stale — run npm run build:index');
    process.exit(1);
  }
  console.log('index.json is up to date');
} else {
  writeFileSync(INDEX_PATH, JSON.stringify(newIndex, null, 2) + '\n');
  console.log(`index.json written (${newIndex.recipes.length} recipes)`);
}
