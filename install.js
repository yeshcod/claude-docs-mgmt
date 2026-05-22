#!/usr/bin/env node
/**
 * claude-docs-mgmt installer
 *
 * Copies the framework files into a target project. Pure Node, zero deps.
 *
 * Usage:
 *   node install.js                                  # default: profile=fullstack-web, target=cwd
 *   node install.js --profile backend-only
 *   node install.js --target /path/to/project
 *   node install.js --project-name "Acme ERP"       # override auto-detect
 *   node install.js --dry-run                       # print what would happen
 *   node install.js --force                         # overwrite existing files
 *   node install.js --help
 *
 * Profiles: fullstack-web (default) | backend-only | library | mobile
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const VALID_PROFILES = ['fullstack-web', 'backend-only', 'library', 'mobile'];

function parseArgs(argv) {
  const out = { profile: 'fullstack-web', target: process.cwd(), force: false, dryRun: false, projectName: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--profile') out.profile = argv[++i];
    else if (a === '--target') out.target = path.resolve(argv[++i]);
    else if (a === '--project-name') out.projectName = argv[++i];
    else if (a === '--force') out.force = true;
    else if (a === '--dry-run') out.dryRun = true;
    else { console.error(`unknown arg: ${a}`); process.exit(2); }
  }
  return out;
}

function printHelp() {
  process.stdout.write(`claude-docs-mgmt installer\n\n${require('fs').readFileSync(__filename, 'utf8').split('\n').slice(2, 18).map(l => l.replace(/^ \* ?/, '')).join('\n')}\n`);
}

function detectProjectName(targetDir) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf8'));
    if (pkg.name) return String(pkg.name).replace(/^@[^/]+\//, '');
  } catch {}
  try {
    const url = execSync(`git -C "${targetDir}" config --get remote.origin.url`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    const m = url.match(/[:/]([^/]+?)(\.git)?$/);
    if (m) return m[1];
  } catch {}
  return path.basename(targetDir);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function rewriteContent(buf, projectName) {
  // Only auto-substitute the universally-safe placeholders. Stack-specific
  // ones ({{STACK_FRONTEND}}, etc.) are left for the user to fill — too
  // project-specific to guess.
  return buf
    .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
    .replace(/\{\{CURRENT_DATE\}\}/g, todayISO())
    .replace(/\{\{YEAR\}\}/g, String(new Date().getFullYear()));
}

const TEXT_EXTENSIONS = new Set(['.md', '.json', '.js', '.ts', '.txt', '.snippet']);
function isTextFile(file) {
  return TEXT_EXTENSIONS.has(path.extname(file));
}

function listFiles(dir, base = dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    const rel = path.relative(base, full);
    if (ent.isDirectory()) out.push(...listFiles(full, base));
    else out.push({ src: full, rel });
  }
  return out;
}

function copyFile({ src, dest, projectName, force, dryRun }) {
  if (fs.existsSync(dest) && !force) return { status: 'skip', dest };
  if (dryRun) return { status: fs.existsSync(dest) ? 'overwrite' : 'create', dest };
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (isTextFile(src)) {
    fs.writeFileSync(dest, rewriteContent(fs.readFileSync(src, 'utf8'), projectName));
  } else {
    fs.copyFileSync(src, dest);
  }
  return { status: fs.existsSync(dest) ? 'created' : 'created', dest };
}

function copyTree({ srcRoot, destRoot, projectName, force, dryRun }) {
  const results = [];
  for (const { src, rel } of listFiles(srcRoot)) {
    const dest = path.join(destRoot, rel);
    results.push(copyFile({ src, dest, projectName, force, dryRun }));
  }
  return results;
}

function appendGitignore({ snippetPath, target, dryRun }) {
  if (!fs.existsSync(snippetPath)) return { status: 'no-snippet' };
  const gi = path.join(target, '.gitignore');
  const snippet = fs.readFileSync(snippetPath, 'utf8');
  const marker = '# claude-docs-mgmt';
  let existing = '';
  try { existing = fs.readFileSync(gi, 'utf8'); } catch {}
  if (existing.includes(marker)) return { status: 'already-marked', dest: gi };
  if (dryRun) return { status: 'append', dest: gi };
  fs.appendFileSync(gi, (existing && !existing.endsWith('\n') ? '\n' : '') + '\n' + snippet + (snippet.endsWith('\n') ? '' : '\n'));
  return { status: 'appended', dest: gi };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { printHelp(); return; }
  if (!VALID_PROFILES.includes(args.profile)) {
    console.error(`invalid profile: ${args.profile}. Valid: ${VALID_PROFILES.join(', ')}`);
    process.exit(2);
  }
  if (!fs.existsSync(args.target)) {
    console.error(`target does not exist: ${args.target}`);
    process.exit(2);
  }
  const projectName = args.projectName ?? detectProjectName(args.target);

  process.stdout.write(`claude-docs-mgmt installer\n`);
  process.stdout.write(`  profile:      ${args.profile}\n`);
  process.stdout.write(`  target:       ${args.target}\n`);
  process.stdout.write(`  project name: ${projectName}\n`);
  process.stdout.write(`  mode:         ${args.dryRun ? 'dry-run' : args.force ? 'force-overwrite' : 'skip-existing'}\n\n`);

  const commonClaude = path.join(ROOT, 'framework/_common/claude');
  const commonRoot = path.join(ROOT, 'framework/_common/root');
  const profileClaude = path.join(ROOT, `framework/${args.profile}/claude`);

  // 1. Copy _common/claude → <target>/.claude
  const r1 = copyTree({
    srcRoot: commonClaude,
    destRoot: path.join(args.target, '.claude'),
    projectName, force: args.force, dryRun: args.dryRun,
  });

  // 2. Copy _common/root → <target>/
  const r2 = copyTree({
    srcRoot: commonRoot,
    destRoot: args.target,
    projectName, force: args.force, dryRun: args.dryRun,
  });

  // 3. Overlay <profile>/claude → <target>/.claude
  const r3 = copyTree({
    srcRoot: profileClaude,
    destRoot: path.join(args.target, '.claude'),
    projectName, force: args.force, dryRun: args.dryRun,
  });

  // 4. Append to .gitignore
  const gi = appendGitignore({
    snippetPath: path.join(ROOT, 'framework/_common/gitignore.snippet'),
    target: args.target,
    dryRun: args.dryRun,
  });

  const all = [...r1, ...r2, ...r3];
  const counts = all.reduce((acc, x) => ((acc[x.status] = (acc[x.status] || 0) + 1), acc), {});
  process.stdout.write(`\nFile summary:\n`);
  for (const k of Object.keys(counts).sort()) process.stdout.write(`  ${k.padEnd(12)} ${counts[k]}\n`);
  process.stdout.write(`\n.gitignore: ${gi.status}\n`);

  if (args.dryRun) {
    process.stdout.write(`\n(dry-run — nothing was written)\n`);
  } else {
    process.stdout.write(`\nNext steps:\n`);
    process.stdout.write(`  1. Open ${args.target}/CLAUDE.md and fill the Critical Rules section.\n`);
    process.stdout.write(`  2. Skim .claude/docs/code-standards.md — trim the rules your team doesn't agree with.\n`);
    process.stdout.write(`  3. Customise .claude/hooks/post-tool-use.js with per-path nudges for your project layout.\n`);
    process.stdout.write(`  4. Grep for {{STACK_FRONTEND}}, {{STACK_BACKEND}}, etc. in .claude/docs/ and fill them in.\n`);
    process.stdout.write(`  5. Restart Claude Code so hooks pick up.\n`);
    process.stdout.write(`  6. Commit: git add -A && git commit -m "docs: bootstrap claude-docs-mgmt framework (${args.profile})"\n`);
  }
}

main();
