#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(REPO_ROOT, 'skills');
const MARKETPLACE_PATH = path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json');

const NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_NAME_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 1024;
const BODY_LINE_LIMIT = 500;

// Standard project directories and files to ignore when checking skill relative paths
const GENERIC_PROJECT_DIRS = [
  'src/', 'app/', 'lib/', 'tests/', 'test/', 'public/', 'config/',
  'dist/', 'build/', 'node_modules/', 'apps/', 'packages/', 'components/',
  'pages/', 'styles/', 'server/', 'client/', 'docs/', 'scripts/', 'skills/', 'templates/',
  'assets/', 'screenshots/', 'static/', 'media/',
];

const GENERIC_PROJECT_FILES = new Set([
  'package.json', 'package-lock.json', 'tsconfig.json', 'nest-cli.json',
  '.env', '.env.local', '.env.example', '.env.production',
  'docker-compose.yml', 'dockerfile', 'makefile',
  'claude.md', 'agents.md', 'readme.md', 'changelog.md', 'third_party_licenses.md',
  'license', 'license.md', 'contributing.md', '.gitignore', 'seed.ts',
  'design.md',
]);

const BUILTIN_SLASH_COMMANDS = new Set([
  'clear', 'help', 'init', 'compact', 'cost', 'exit', 'quit', 'reset', 'review', 'login', 'logout',
]);

const SYSTEM_DIRS = new Set([
  'bin', 'boot', 'dev', 'etc', 'home', 'lib', 'lib64', 'media',
  'mnt', 'opt', 'proc', 'root', 'run', 'sbin', 'srv', 'sys', 'tmp', 'usr', 'var',
]);

const HTTP_TERMS = new Set([
  'health', 'api', 'auth', 'login', 'logout', 'signup', 'users', 'user', 'items', 'item',
]);

const BUNDLED_PREFIXES = [
  'references/', 'flow/', 'modes/', 'patterns/', 'agents/', 'internal/',
  'agent-modes/', 'assets/', 'templates/', 'scripts/', 'examples/',
];

/**
 * Parses frontmatter from a markdown string.
 * Supports standard YAML scalar styles, multiline blocks (> and |), nested metadata, and arrays.
 */
export function parseFrontmatter(content) {
  if (!content.startsWith('---')) {
    return { error: 'File does not start with frontmatter delimiter (---)' };
  }

  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { error: 'Frontmatter delimiter is unclosed or malformed (expected opening and closing ---)' };
  }

  const rawYaml = match[1];
  const body = match[2];
  const lines = rawYaml.split(/\r?\n/);
  const data = {};

  let currentKey = null;
  let multilineType = null; // 'folded' (>), 'literal' (|), or 'indent'
  let multilineBuffer = [];
  let inNestedKey = null;

  function commitMultiline() {
    if (currentKey && multilineType) {
      let val;
      if (multilineType === 'literal') {
        val = multilineBuffer.join('\n');
      } else if (multilineType === 'folded') {
        val = multilineBuffer.join(' ').replace(/\s+/g, ' ').trim();
      } else {
        val = multilineBuffer.join(' ').replace(/\s+/g, ' ').trim();
      }
      if (inNestedKey) {
        data[inNestedKey][currentKey] = val;
      } else {
        data[currentKey] = val;
      }
      multilineBuffer = [];
      multilineType = null;
      currentKey = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines or pure comments if not in a multiline block
    if (!trimmed || trimmed.startsWith('#')) {
      if (multilineType && (line.startsWith('  ') || line.startsWith('\t'))) {
        multilineBuffer.push('');
      }
      continue;
    }

    const indent = line.search(/\S/);

    // Multiline continuation
    if (multilineType && indent > 0) {
      multilineBuffer.push(line.trim());
      continue;
    } else if (multilineType) {
      commitMultiline();
    }

    // List item (e.g., under allowed-tools or metadata)
    if (trimmed.startsWith('- ')) {
      const itemVal = stripQuotes(trimmed.slice(2).trim());
      if (currentKey && Array.isArray(data[currentKey])) {
        data[currentKey].push(itemVal);
        continue;
      } else if (inNestedKey && currentKey && Array.isArray(data[inNestedKey]?.[currentKey])) {
        data[inNestedKey][currentKey].push(itemVal);
        continue;
      }
    }

    // Nested object key indented (e.g., metadata:\n  source: custom)
    if (inNestedKey && indent > 0) {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const subKey = line.slice(0, colonIdx).trim();
        const subVal = line.slice(colonIdx + 1).trim();
        if (subVal === '') {
          currentKey = subKey;
          data[inNestedKey][subKey] = [];
        } else {
          data[inNestedKey][subKey] = stripQuotes(subVal);
        }
        continue;
      }
    } else {
      inNestedKey = null;
    }

    // Top-level key: value
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      commitMultiline();
      const key = line.slice(0, colonIdx).trim();
      const rawVal = line.slice(colonIdx + 1).trim();

      if (rawVal === '>' || rawVal === '>-') {
        currentKey = key;
        multilineType = 'folded';
        multilineBuffer = [];
      } else if (rawVal === '|' || rawVal === '|-') {
        currentKey = key;
        multilineType = 'literal';
        multilineBuffer = [];
      } else if (rawVal === '') {
        // Could be a nested object or list
        if (key === 'metadata') {
          inNestedKey = 'metadata';
          data.metadata = {};
        } else if (key === 'allowed-tools') {
          currentKey = key;
          data[key] = [];
        } else {
          currentKey = key;
          multilineType = 'indent';
          multilineBuffer = [];
        }
      } else if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
        // Inline array: [a, b]
        const items = rawVal.slice(1, -1).split(',').map(s => stripQuotes(s.trim())).filter(Boolean);
        data[key] = items;
      } else {
        // Plain scalar or start of folded without indicator
        data[key] = stripQuotes(rawVal);
        currentKey = key;
      }
    } else if (currentKey && indent > 0) {
      // Continuation of previous key
      if (!multilineType) {
        multilineType = 'indent';
        multilineBuffer = [data[currentKey]];
      }
      multilineBuffer.push(line.trim());
    }
  }

  commitMultiline();

  return { data, body, rawYaml };
}

function stripQuotes(str) {
  if (typeof str !== 'string') return str;
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  return str;
}

/**
 * Validates a single skill directory.
 * Returns { skillName, status: 'PASS' | 'WARN' | 'FAIL', errors: [], warnings: [] }
 */
export function validateSkill(dirName, availableSkillDirs = new Set()) {
  const skillDir = path.join(SKILLS_DIR, dirName);
  const skillFile = path.join(skillDir, 'SKILL.md');
  const errors = [];
  const warnings = [];

  // 1. Required file: SKILL.md
  if (!fs.existsSync(skillFile)) {
    return {
      skillName: dirName,
      status: 'FAIL',
      errors: [`Missing SKILL.md in skills/${dirName}`],
      warnings: [],
    };
  }

  let content;
  try {
    content = fs.readFileSync(skillFile, 'utf8');
  } catch (err) {
    return {
      skillName: dirName,
      status: 'FAIL',
      errors: [`Unable to read SKILL.md: ${err.message}`],
      warnings: [],
    };
  }

  // 2. YAML Frontmatter check
  const parsed = parseFrontmatter(content);
  if (parsed.error) {
    errors.push(parsed.error);
    return {
      skillName: dirName,
      status: 'FAIL',
      errors,
      warnings,
    };
  }

  const { data, body } = parsed;

  // 3. Name rules
  if (!data.name || typeof data.name !== 'string') {
    errors.push("Missing required frontmatter field: 'name'");
  } else {
    const name = data.name.trim();
    if (name.length < 1 || name.length > MAX_NAME_LENGTH) {
      errors.push(`'name' must be between 1 and ${MAX_NAME_LENGTH} characters (got ${name.length})`);
    }
    if (!NAME_REGEX.test(name)) {
      errors.push(`'name' "${name}" is invalid; must be lowercase alphanumeric with single hyphens (e.g. "my-skill-name")`);
    }
    if (name !== dirName) {
      errors.push(`'name' "${name}" does not match folder name "${dirName}"`);
    }
  }

  // 4. Description rules
  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push("Missing or empty required frontmatter field: 'description'");
  } else {
    const desc = data.description.trim();
    if (desc.length > MAX_DESCRIPTION_LENGTH) {
      errors.push(`'description' exceeds maximum length of ${MAX_DESCRIPTION_LENGTH} characters (got ${desc.length})`);
    }
  }

  // 5. Progressive disclosure check (warning)
  const bodyLines = body.split(/\r?\n/).length;
  if (bodyLines > BODY_LINE_LIMIT) {
    warnings.push(`Progressive disclosure: SKILL.md body has ${bodyLines} lines (exceeds ${BODY_LINE_LIMIT} lines; consider offloading details to references/)`);
  }

  // 6. Relative file reference check (hard error)
  // Strip fenced code blocks before analyzing file links
  const bodyWithoutCodeBlocks = body.replace(/```[\s\S]*?```/g, '');
  const referencedPaths = extractReferencedPaths(bodyWithoutCodeBlocks, skillDir);

  for (const ref of referencedPaths) {
    if (isIgnoredPath(ref)) {
      continue;
    }

    const resolved = path.resolve(skillDir, ref);
    if (!fs.existsSync(resolved)) {
      errors.push(`Broken relative reference: "${ref}" (file not found in skill folder)`);
    }
  }

  // 7. Cross-skill handoff check (warning)
  const slashCommands = extractSlashCommands(bodyWithoutCodeBlocks);
  for (const cmd of slashCommands) {
    // If it's a known unix system path, common HTTP term, or built-in slash command, skip
    if (SYSTEM_DIRS.has(cmd) || HTTP_TERMS.has(cmd) || BUILTIN_SLASH_COMMANDS.has(cmd)) {
      continue;
    }
    // If command doesn't exist in skills/ and is not the current skill
    if (cmd !== dirName && !availableSkillDirs.has(cmd)) {
      warnings.push(`Cross-skill reference: "/${cmd}" is referenced, but skill "skills/${cmd}" does not exist`);
    }
  }

  const status = errors.length > 0 ? 'FAIL' : warnings.length > 0 ? 'WARN' : 'PASS';
  return {
    skillName: dirName,
    status,
    errors,
    warnings,
  };
}

/**
 * Validates .claude-plugin/marketplace.json manifest.
 * Checks that file exists, is valid JSON, has non-empty plugins array,
 * every skill path resolves to skills/<name>/SKILL.md, and all skills in skills/
 * are categorized without orphans or duplicates.
 */
export function validateMarketplace(skillDirs = []) {
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(MARKETPLACE_PATH)) {
    return {
      status: 'FAIL',
      errors: ['Missing .claude-plugin/marketplace.json manifest'],
      warnings,
      categorizedSkills: new Map(),
      pluginCount: 0,
    };
  }

  let data;
  try {
    const raw = fs.readFileSync(MARKETPLACE_PATH, 'utf8');
    data = JSON.parse(raw);
  } catch (err) {
    return {
      status: 'FAIL',
      errors: [`Invalid JSON in .claude-plugin/marketplace.json: ${err.message}`],
      warnings,
      categorizedSkills: new Map(),
      pluginCount: 0,
    };
  }

  if (!data || !Array.isArray(data.plugins) || data.plugins.length === 0) {
    return {
      status: 'FAIL',
      errors: [".claude-plugin/marketplace.json must contain a non-empty 'plugins' array"],
      warnings,
      categorizedSkills: new Map(),
      pluginCount: 0,
    };
  }

  const categorizedSkills = new Map(); // skillName -> pluginName

  for (const plugin of data.plugins) {
    if (!plugin.name || typeof plugin.name !== 'string') {
      errors.push("Plugin in marketplace.json missing required 'name' string");
      continue;
    }

    if (!Array.isArray(plugin.skills)) {
      errors.push(`Plugin "${plugin.name}" must contain a 'skills' array`);
      continue;
    }

    for (const skillEntry of plugin.skills) {
      if (typeof skillEntry !== 'string') {
        errors.push(`Plugin "${plugin.name}" has non-string skill entry: ${JSON.stringify(skillEntry)}`);
        continue;
      }

      const skillName = skillEntry.replace(/^\.\//, '').trim();
      const skillMdPath = path.join(SKILLS_DIR, skillName, 'SKILL.md');

      if (!fs.existsSync(skillMdPath)) {
        errors.push(`Plugin "${plugin.name}" declares nonexistent skill: "${skillEntry}" (expected at skills/${skillName}/SKILL.md)`);
      }

      if (categorizedSkills.has(skillName)) {
        errors.push(`Skill "${skillName}" is duplicated across plugin groups: "${categorizedSkills.get(skillName)}" and "${plugin.name}"`);
      } else {
        categorizedSkills.set(skillName, plugin.name);
      }
    }
  }

  // Check that every directory in skills/ is categorized in marketplace.json
  for (const dir of skillDirs) {
    if (!categorizedSkills.has(dir)) {
      errors.push(`Skill directory "skills/${dir}" is not categorized in .claude-plugin/marketplace.json`);
    }
  }

  const status = errors.length > 0 ? 'FAIL' : warnings.length > 0 ? 'WARN' : 'PASS';
  return {
    status,
    errors,
    warnings,
    categorizedSkills,
    pluginCount: data.plugins.length,
  };
}

/**
 * Extracts relative file references from markdown links and backticks.
 */
function extractReferencedPaths(markdown, skillDir) {
  const refs = new Set();

  // 1. Markdown links: [text](path)
  const linkRegex = /\[[^\]]*\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(markdown)) !== null) {
    const target = match[1].trim();
    const cleanPath = target.split('#')[0].split('?')[0].trim();
    if (isCandidateLinkTarget(cleanPath)) {
      refs.add(cleanPath);
    }
  }

  // 2. Backticks: explicit relative paths `./file.ext` or `references/file.ext`
  const codeRegex = /`([^`\n]+)`/g;
  while ((match = codeRegex.exec(markdown)) !== null) {
    const candidate = match[1].trim();
    const cleanPath = candidate.split('#')[0].split('?')[0].trim();
    if (isCandidateBacktickPath(cleanPath, skillDir)) {
      refs.add(cleanPath);
    }
  }

  return Array.from(refs);
}

function isCandidateLinkTarget(p) {
  if (!p) return false;
  // Ignore URLs, protocols, anchors
  if (/^[a-z][a-z0-9+.-]*:/i.test(p) || p.startsWith('//') || p.startsWith('#')) {
    return false;
  }
  // Ignore variables, wildcards, placeholders
  if (p.includes('$') || p.includes('*') || p.includes('?') || p.includes('<') || p.includes('>')) {
    return false;
  }
  // Ignore template numbers like NNNN
  if (p.includes('NNNN') || p.includes('…') || p.includes('...')) {
    return false;
  }
  // Ignore absolute filesystem paths starting with /
  if (p.startsWith('/')) {
    return false;
  }
  return true;
}

function isCandidateBacktickPath(p, skillDir) {
  if (!p) return false;
  // Must not have whitespace, flags, template placeholders, variables, or wildcards
  if (/\s/.test(p) || p.startsWith('-') || p.startsWith('{{') || p.endsWith('}}') || p.includes('$')) {
    return false;
  }
  if (p.includes('*') || p.includes('?') || p.includes('<') || p.includes('>') || p.includes('NNNN') || p.includes('…')) {
    return false;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(p) || p.startsWith('//') || p.startsWith('#') || p.startsWith('/')) {
    return false;
  }
  // Pure file extensions like `.ts` or `.js` are not file paths
  if (/^\.[a-z0-9]+$/i.test(p)) {
    return false;
  }

  // Explicit relative paths like `./foo.md` or `../foo.md`
  if (p.startsWith('./') || p.startsWith('../')) {
    return true;
  }

  // Subfolders bundled in skill
  if (BUNDLED_PREFIXES.some(prefix => p.startsWith(prefix))) {
    return true;
  }

  // If it's a bare sibling file name (e.g., `agent-prompt.md`) that actually exists in this skill folder, verify it
  if (!p.includes('/') && /\.(md|txt|json|yaml|yml|sh|mjs|js|ts)$/i.test(p)) {
    if (skillDir && fs.existsSync(path.join(skillDir, p))) {
      return true;
    }
  }

  return false;
}

function isIgnoredPath(ref) {
  const normalized = ref.replace(/^[./\\]+/, '').toLowerCase();
  const base = path.basename(normalized);

  if (GENERIC_PROJECT_FILES.has(base)) return true;

  for (const dir of GENERIC_PROJECT_DIRS) {
    if (normalized.startsWith(dir)) return true;
  }

  return false;
}

/**
 * Extracts slash commands (e.g., /architect, /test, /audit).
 */
function extractSlashCommands(markdown) {
  const commands = new Set();
  const lines = markdown.split(/\r?\n/);

  for (const line of lines) {
    // Check if line mentions HTTP methods or endpoint/route context
    const isHttpRoute = /\b(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD|endpoint|route|HTTP|cookie|headers?)\b/i.test(line);

    const slashRegex = /(?:^|[\s(`'"])(\/([a-z0-9]+(?:-[a-z0-9]+)*))(?=[^\w\/-]|$)/g;
    let match;
    while ((match = slashRegex.exec(line)) !== null) {
      const cmd = match[2];

      // If line is in HTTP context and cmd is a common route name, skip
      if (isHttpRoute && HTTP_TERMS.has(cmd)) {
        continue;
      }

      // Check it's not a path (e.g. followed immediately by /)
      const afterIndex = match.index + match[0].length;
      if (line[afterIndex] === '/') {
        continue;
      }

      // Ignore if preceded by : or / (part of URL)
      const beforeIndex = match.index;
      if (beforeIndex > 0 && (line[beforeIndex - 1] === ':' || line[beforeIndex - 1] === '/')) {
        continue;
      }

      commands.add(cmd);
    }
  }

  return Array.from(commands);
}

/**
 * Main execution.
 */
export function runValidation() {
  if (!fs.existsSync(SKILLS_DIR)) {
    fs.mkdirSync(SKILLS_DIR, { recursive: true });
  }

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  const skillDirs = entries
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    .map(entry => entry.name)
    .sort();

  const availableSkillSet = new Set(skillDirs);

  console.log('\n================================================================================');
  console.log('Skill Validator (agentskills.io spec & marketplace)');
  console.log('================================================================================');

  let passedCount = 0;
  let warnedCount = 0;
  let failedCount = 0;

  // 1. Validate individual skills
  const results = skillDirs.map(dir => validateSkill(dir, availableSkillSet));

  if (results.length > 0) {
    console.log(
      padEnd('Skill', 28) +
      padEnd('Status', 10) +
      'Details'
    );
    console.log('-'.repeat(80));

    for (const res of results) {
      const statusLabel =
        res.status === 'PASS' ? '\x1b[32mPASS\x1b[0m' :
        res.status === 'WARN' ? '\x1b[33mWARN\x1b[0m' :
        '\x1b[31mFAIL\x1b[0m';

      const plainStatus = res.status;
      let details = [];

      if (plainStatus === 'PASS') {
        passedCount++;
        details.push('All checks passed');
      } else if (plainStatus === 'WARN') {
        warnedCount++;
        details = res.warnings.map(w => `• [WARN] ${w}`);
      } else {
        failedCount++;
        details = [
          ...res.errors.map(e => `• [ERROR] ${e}`),
          ...res.warnings.map(w => `• [WARN] ${w}`),
        ];
      }

      const firstDetail = details[0] || '';
      console.log(
        padEnd(res.skillName, 28) +
        padEnd(statusLabel, 19) +
        firstDetail
      );

      for (let i = 1; i < details.length; i++) {
        console.log(' '.repeat(38) + details[i]);
      }
    }
  } else {
    console.log('No skills found in skills/ directory.');
  }

  // 2. Validate .claude-plugin/marketplace.json
  const marketRes = validateMarketplace(skillDirs);
  console.log('-'.repeat(80));

  const marketStatusLabel =
    marketRes.status === 'PASS' ? '\x1b[32mPASS\x1b[0m' :
    marketRes.status === 'WARN' ? '\x1b[33mWARN\x1b[0m' :
    '\x1b[31mFAIL\x1b[0m';

  if (marketRes.status === 'PASS') {
    console.log(
      padEnd('marketplace.json', 28) +
      padEnd(marketStatusLabel, 19) +
      `Validated ${marketRes.pluginCount} plugin group(s), all ${skillDirs.length} skill(s) categorized`
    );
  } else {
    failedCount++;
    console.log(
      padEnd('marketplace.json', 28) +
      padEnd(marketStatusLabel, 19) +
      (marketRes.errors[0] || 'Marketplace validation failed')
    );
    for (let i = 1; i < marketRes.errors.length; i++) {
      console.log(' '.repeat(38) + `• [ERROR] ${marketRes.errors[i]}`);
    }
  }

  console.log('-'.repeat(80));
  console.log(
    `Summary: ${results.length} skill(s) scanned | ` +
    `${passedCount} passed | ` +
    `${warnedCount} warning(s) | ` +
    `${failedCount} failed`
  );
  console.log('================================================================================\n');

  const hasHardErrors = failedCount > 0;
  return {
    success: !hasHardErrors,
    count: results.length,
    passed: passedCount,
    warned: warnedCount,
    failed: failedCount,
  };
}

function padEnd(str, length) {
  return str + ' '.repeat(Math.max(0, length - str.length));
}

// Run CLI directly if invoked as script
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  const outcome = runValidation();
  process.exit(outcome.success ? 0 : 1);
}
