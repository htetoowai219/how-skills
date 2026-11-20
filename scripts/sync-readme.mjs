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
const MARKETPLACE_PATH = path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json');

const TABLE_START = '<!-- SKILLS_TABLE_START -->';
const TABLE_END = '<!-- SKILLS_TABLE_END -->';

const args = process.argv.slice(2);
const isListMode = args.includes('--list') || args.includes('-l');

function loadSkillsMap() {
  if (!fs.existsSync(SKILLS_DIR)) {
    return new Map();
  }

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  const skillDirs = entries
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    .map(entry => entry.name)
    .sort();

  const skillsMap = new Map();

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

      skillsMap.set(dir, {
        name,
        dir,
        description,
        source,
      });
    } catch (_) {
      // Ignore unreadable files during sync
    }
  }

  return skillsMap;
}

function loadMarketplace() {
  if (!fs.existsSync(MARKETPLACE_PATH)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(MARKETPLACE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function generateMarkdownContent(skillsMap, marketplace) {
  if (skillsMap.size === 0) {
    return [
      TABLE_START,
      '| Skill | Description |',
      '|---|---|',
      '| _(No skills installed yet)_ | _Use `npm run new -- <skill-name>` to create your first skill._ |',
      TABLE_END,
    ].join('\n');
  }

  const sections = [TABLE_START];

  if (marketplace && Array.isArray(marketplace.plugins) && marketplace.plugins.length > 0) {
    const categorized = new Set();

    for (const plugin of marketplace.plugins) {
      const pluginName = plugin.name || 'unnamed-category';
      const pluginDesc = plugin.description ? `*${plugin.description}*\n` : '';

      sections.push(`### ${pluginName}\n`);
      if (pluginDesc) {
        sections.push(pluginDesc);
      }

      sections.push('| Skill | Description |');
      sections.push('|---|---|');

      const pluginSkills = [];
      if (Array.isArray(plugin.skills)) {
        for (const entry of plugin.skills) {
          const folderName = entry.replace(/^\.\//, '').trim();
          categorized.add(folderName);
          const skill = skillsMap.get(folderName);
          if (skill) {
            pluginSkills.push(skill);
          }
        }
      }

      if (pluginSkills.length === 0) {
        sections.push('| _(No skills in this category yet)_ | — |');
      } else {
        pluginSkills.sort((a, b) => a.name.localeCompare(b.name));
        for (const s of pluginSkills) {
          const cleanDesc = s.description
            .replace(/\|/g, '\\|')
            .replace(/\r?\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          sections.push(`| [\`${s.name}\`](skills/${s.dir}/SKILL.md) | ${cleanDesc} |`);
        }
      }

      sections.push(''); // blank line between plugin sections
    }

    // Check for any uncategorized skills
    const uncategorized = [];
    for (const [dir, skill] of skillsMap.entries()) {
      if (!categorized.has(dir)) {
        uncategorized.push(skill);
      }
    }

    if (uncategorized.length > 0) {
      sections.push('### Other Skills\n');
      sections.push('| Skill | Description |');
      sections.push('|---|---|');
      uncategorized.sort((a, b) => a.name.localeCompare(b.name));
      for (const s of uncategorized) {
        const cleanDesc = s.description
          .replace(/\|/g, '\\|')
          .replace(/\r?\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        sections.push(`| [\`${s.name}\`](skills/${s.dir}/SKILL.md) | ${cleanDesc} |`);
      }
      sections.push('');
    }
  } else {
    // Fallback if marketplace.json is absent
    sections.push('| Skill | Description | Source |');
    sections.push('|---|---|---|');
    const sorted = Array.from(skillsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    for (const s of sorted) {
      const cleanDesc = s.description
        .replace(/\|/g, '\\|')
        .replace(/\r?\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      sections.push(`| [\`${s.name}\`](skills/${s.dir}/SKILL.md) | ${cleanDesc} | \`${s.source}\` |`);
    }
    sections.push('');
  }

  // Remove trailing empty line before TABLE_END
  while (sections[sections.length - 1] === '') {
    sections.pop();
  }

  sections.push(TABLE_END);
  return sections.join('\n');
}

function syncReadme() {
  const skillsMap = loadSkillsMap();
  const marketplace = loadMarketplace();

  if (isListMode) {
    console.log('\n================================================================================');
    console.log(`Installed Skills (${skillsMap.size})`);
    console.log('================================================================================');

    if (skillsMap.size === 0) {
      console.log('No skills installed yet in skills/.');
      console.log('Create a skill using: npm run new -- <skill-name>');
    } else if (marketplace && Array.isArray(marketplace.plugins)) {
      const shown = new Set();
      for (const plugin of marketplace.plugins) {
        const pluginSkills = (plugin.skills || [])
          .map(e => e.replace(/^\.\//, '').trim())
          .filter(name => skillsMap.has(name))
          .map(name => skillsMap.get(name));

        console.log(`\n\x1b[1mGroup: ${plugin.name}\x1b[0m (${pluginSkills.length} skill${pluginSkills.length === 1 ? '' : 's'})`);
        if (plugin.description) {
          console.log(`  \x1b[2m${plugin.description}\x1b[0m`);
        }

        for (const s of pluginSkills) {
          shown.add(s.dir);
          console.log(`  • \x1b[1m${s.name}\x1b[0m: ${s.description}`);
        }
      }

      const others = Array.from(skillsMap.values()).filter(s => !shown.has(s.dir));
      if (others.length > 0) {
        console.log(`\n\x1b[1mGroup: Uncategorized\x1b[0m (${others.length})`);
        for (const s of others) {
          console.log(`  • \x1b[1m${s.name}\x1b[0m: ${s.description}`);
        }
      }
    } else {
      for (const s of skillsMap.values()) {
        console.log(`• \x1b[1m${s.name}\x1b[0m [\x1b[36m${s.source}\x1b[0m]`);
        console.log(`  ${s.description}`);
      }
    }

    console.log('\n================================================================================\n');
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

  const newContent = generateMarkdownContent(skillsMap, marketplace);
  const updatedReadme =
    readmeContent.slice(0, startIndex) +
    newContent +
    readmeContent.slice(endIndex + TABLE_END.length);

  fs.writeFileSync(README_PATH, updatedReadme, 'utf8');
  console.log(`\n\x1b[32m✔\x1b[0m Successfully synced ${skillsMap.size} skill(s) categorized into README.md.\n`);
}

syncReadme();
