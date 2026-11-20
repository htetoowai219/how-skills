#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(REPO_ROOT, 'skills');
const TEMPLATE_DIR = path.join(REPO_ROOT, 'templates', 'skill-template');

const NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_NAME_LENGTH = 64;

// Filter out npm argument separator '--'
const args = process.argv.slice(2).filter(arg => arg !== '--');
const skillName = args[0]?.trim();

if (!skillName) {
  console.error('\nError: No skill name specified.');
  console.error('Usage: npm run new -- <skill-name>');
  console.error('Example: npm run new -- code-reviewer\n');
  process.exit(1);
}

if (skillName.length < 1 || skillName.length > MAX_NAME_LENGTH) {
  console.error(`\nError: Skill name must be between 1 and ${MAX_NAME_LENGTH} characters (got ${skillName.length}).\n`);
  process.exit(1);
}

if (!NAME_REGEX.test(skillName)) {
  console.error(`\nError: Invalid skill name "${skillName}".`);
  console.error('Skill names must:');
  console.error('- Use only lowercase alphanumeric characters and single hyphens');
  console.error('- Not start or end with a hyphen');
  console.error('- Not contain consecutive hyphens');
  console.error('Example: my-custom-skill\n');
  process.exit(1);
}

if (!fs.existsSync(TEMPLATE_DIR)) {
  console.error(`\nError: Template directory not found at: ${TEMPLATE_DIR}\n`);
  process.exit(1);
}

const targetDir = path.join(SKILLS_DIR, skillName);

if (fs.existsSync(targetDir)) {
  console.error(`\nError: Skill directory already exists: skills/${skillName}\n`);
  process.exit(1);
}

// Ensure skills/ directory exists
if (!fs.existsSync(SKILLS_DIR)) {
  fs.mkdirSync(SKILLS_DIR, { recursive: true });
}

try {
  // Recursively copy template to target skill directory
  fs.cpSync(TEMPLATE_DIR, targetDir, { recursive: true });

  // Process copied files to replace {{SKILL_NAME}} and clean placeholders
  replacePlaceholdersInDir(targetDir, skillName);

  console.log(`\n\x1b[32m✔\x1b[0m Successfully created skill \x1b[1m"${skillName}"\x1b[0m at:`);
  console.log(`  skills/${skillName}/\n`);
  console.log('Next steps:');
  console.log(`  1. Edit skills/${skillName}/SKILL.md`);
  console.log(`  2. Add deep-dive guides or checklists in skills/${skillName}/references/`);
  console.log(`  3. Run: npm run validate`);
  console.log(`  4. Run: npm run sync-readme\n`);
} catch (err) {
  console.error(`\nError creating skill: ${err.message}\n`);
  // Cleanup target directory if partially created
  if (fs.existsSync(targetDir)) {
    try {
      fs.rmSync(targetDir, { recursive: true, force: true });
    } catch (_) {}
  }
  process.exit(1);
}

function replacePlaceholdersInDir(dirPath, name) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      replacePlaceholdersInDir(fullPath, name);
    } else if (entry.isFile()) {
      // Process markdown and text files
      if (/\.(md|txt|json|yaml|yml)$/i.test(entry.name)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replaceAll('{{SKILL_NAME}}', name);
        // Remove template comment markers if present (<!-- TEMPLATE_ONLY --> ... <!-- /TEMPLATE_ONLY -->)
        content = content.replace(/<!--\s*TEMPLATE_ONLY[\s\S]*?\/TEMPLATE_ONLY\s*-->/g, '');
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}
