#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './validate-skills.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(REPO_ROOT, 'skills');
const README_PATH = path.join(REPO_ROOT, 'README.md');

const TABLE_START = '<!-- SKILLS_TABLE_START -->';
const TABLE_END = '<!-- SKILLS_TABLE_END -->';

const args = process.argv.slice(2);
const isListMode = args.includes('--list') || args.includes('-l');

function loadSkills() {
  if (!fs.existsSync(SKILLS_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  const skillDirs = entries
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    .map(entry => entry.name)
    .sort();

  const skills = [];

  for (const dir of skillDirs) {
    const skillMdPath = path.join(SKILLS_DIR, dir, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) {
      continue;
    }

    try {
      const content = fs.readFileSync(skillMdPath, 'utf8');
      const { data, error } = parseFrontmatter(content);
      if (error || !data) {
        continue;
      }

      const name = data.name || dir;
      const description = data.description || 'No description provided.';
      const source = data.metadata?.source || 'custom';

      skills.push({
        name,
        dir,
        description,
        source,
      });
    } catch (_) {
      // Ignore unreadable files during sync
    }
  }

  return skills;
}

function generateMarkdownTable(skills) {
  if (skills.length === 0) {
    return [
      TABLE_START,
      '| Skill | Description | Source |',
      '|---|---|---|',
      '| _(No skills installed yet)_ | _Use `npm run new -- <skill-name>` to create your first skill._ | — |',
      TABLE_END,
    ].join('\n');
  }

  const rows = [
    TABLE_START,
    '| Skill | Description | Source |',
    '|---|---|---|',
  ];

  for (const s of skills) {
    // Sanitize description for markdown table
    const cleanDesc = s.description
      .replace(/\|/g, '\\|')
      .replace(/\r?\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    rows.push(`| [\`${s.name}\`](skills/${s.dir}/SKILL.md) | ${cleanDesc} | \`${s.source}\` |`);
  }

  rows.push(TABLE_END);
  return rows.join('\n');
}

function syncReadme() {
  const skills = loadSkills();

  if (isListMode) {
    console.log('\n================================================================================');
    console.log(`Installed Skills (${skills.length})`);
    console.log('================================================================================');
    if (skills.length === 0) {
      console.log('No skills installed yet in skills/.');
      console.log('Create a skill using: npm run new -- <skill-name>');
    } else {
      for (const s of skills) {
        console.log(`• \x1b[1m${s.name}\x1b[0m [\x1b[36m${s.source}\x1b[0m]`);
        console.log(`  ${s.description}`);
      }
    }
    console.log('================================================================================\n');
    return;
  }

  if (!fs.existsSync(README_PATH)) {
    console.error(`\nError: README.md not found at ${README_PATH}\n`);
    process.exit(1);
  }

  const readmeContent = fs.readFileSync(README_PATH, 'utf8');

  const startIndex = readmeContent.indexOf(TABLE_START);
  const endIndex = readmeContent.indexOf(TABLE_END);

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    console.error(
      `\nError: Could not locate catalog table markers in README.md.\n` +
      `Ensure README.md contains both:\n` +
      `  ${TABLE_START}\n` +
      `  ${TABLE_END}\n`
    );
    process.exit(1);
  }

  const newTable = generateMarkdownTable(skills);
  const updatedReadme =
    readmeContent.slice(0, startIndex) +
    newTable +
    readmeContent.slice(endIndex + TABLE_END.length);

  fs.writeFileSync(README_PATH, updatedReadme, 'utf8');
  console.log(`\n\x1b[32m✔\x1b[0m Successfully synced ${skills.length} skill(s) to README.md catalog table.\n`);
}

syncReadme();
