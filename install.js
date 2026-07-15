#!/usr/bin/env node
/**
 * claude-docs-mgmt installer
 *
 * Copies the framework files (docs, hooks, skills) + the agent team into a
 * target project. Pure Node, zero deps.
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

// The agent team. Single source in framework/_agents/<name>.md — NOT duplicated
// per profile; the manifest below just selects which ones a profile installs.
// These are what make the processes.md pipeline (BA → UX + tech-lead → …)
// actually deliverable rather than aspirational prose.
const UNIVERSAL_AGENTS = ['business-analyst', 'tech-lead', 'security-reviewer', 'qa-automation', 'sre'];
const UI_AGENTS = ['frontend-engineer', 'ux-designer', 'design-system-guard', 'qa-manual'];
const SERVER_AGENTS = ['backend-engineer', 'db-architect'];

const AGENTS_BY_PROFILE = {
  'fullstack-web': [...UNIVERSAL_AGENTS, ...SERVER_AGENTS, ...UI_AGENTS],
  'backend-only': [...UNIVERSAL_AGENTS, ...SERVER_AGENTS],
  'mobile': [...UNIVERSAL_AGENTS, ...SERVER_AGENTS, ...UI_AGENTS],
  'library': [...UNIVERSAL_AGENTS],
};

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
  // Parse the leading block comment rather than slicing magic line numbers —
  // editing the banner used to silently shift the slice and print a stray "*/".
  const banner = (fs.readFileSync(__filename, 'utf8').match(/\/\*\*([\s\S]*?)\*\//)?.[1] ?? '')
    .split('\n')
    .map((l) => l.replace(/^\s*\* ?/, ''))
    .join('\n')
    .trim();
  process.stdout.write(`${banner}\n`);
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

// Copies only the agents the profile selects, from the single _agents source.
// A missing source file is reported (not fatal) so a partial checkout surfaces
// loudly instead of silently installing an incomplete team.
function copyAgents({ profile, destRoot, projectName, force, dryRun }) {
  const srcRoot = path.join(ROOT, 'framework/_agents');
  const results = [];
  for (const name of AGENTS_BY_PROFILE[profile] ?? []) {
    const src = path.join(srcRoot, `${name}.md`);
    if (!fs.existsSync(src)) {
      results.push({ status: 'missing-src', dest: src });
      continue;
    }
    results.push(copyFile({ src, dest: path.join(destRoot, `${name}.md`), projectName, force, dryRun }));
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

  // 4. Copy the profile's agent team → <target>/.claude/agents
  const r4 = copyAgents({
    profile: args.profile,
    destRoot: path.join(args.target, '.claude/agents'),
    projectName, force: args.force, dryRun: args.dryRun,
  });

  // 5. Append to .gitignore
  const gi = appendGitignore({
    snippetPath: path.join(ROOT, 'framework/_common/gitignore.snippet'),
    target: args.target,
    dryRun: args.dryRun,
  });

  const all = [...r1, ...r2, ...r3, ...r4];
  const counts = all.reduce((acc, x) => ((acc[x.status] = (acc[x.status] || 0) + 1), acc), {});
  process.stdout.write(`\nFile summary:\n`);
  for (const k of Object.keys(counts).sort()) process.stdout.write(`  ${k.padEnd(12)} ${counts[k]}\n`);
  process.stdout.write(`\nAgents (${args.profile}): ${(AGENTS_BY_PROFILE[args.profile] ?? []).length}\n`);
  process.stdout.write(`.gitignore: ${gi.status}\n`);

  const missing = r4.filter((x) => x.status === 'missing-src');
  if (missing.length) {
    process.stdout.write(`\nWARNING: ${missing.length} agent file(s) missing from framework/_agents — team is incomplete:\n`);
    for (const m of missing) process.stdout.write(`  ${path.basename(m.dest)}\n`);
  }

  if (args.dryRun) {
    process.stdout.write(`\n(dry-run — nothing was written)\n`);
  } else {
    process.stdout.write(`\nNext steps:\n`);
    process.stdout.write(`  1. Open ${args.target}/CLAUDE.md and fill the Critical Rules section.\n`);
    process.stdout.write(`  2. Skim .claude/docs/code-standards.md — trim the rules your team doesn't agree with.\n`);
    process.stdout.write(`  3. Fill the placeholders — only {{PROJECT_NAME}}, {{CURRENT_DATE}}, {{YEAR}} were\n`);
    process.stdout.write(`     auto-substituted. Grep .claude/ for the rest and fill them in:\n`);
    process.stdout.write(`       grep -rIl '{{' .claude/ CLAUDE.md\n`);
    process.stdout.write(`     Stack:  {{STACK_FRONTEND}}, {{STACK_BACKEND}}, {{DOMAIN_ENTITIES}}\n`);
    process.stdout.write(`     Deploy: {{PROD_HOST}}, {{DB_URI}}, {{TEST_CMD}}\n`);
    process.stdout.write(`     Dev/QA: {{DEV_LOGIN}}, {{DEV_PASSWORD}}, {{DESIGN_RULES}}\n`);
    process.stdout.write(`  4. Review .claude/agents/sre.md before your first deploy — it owns commit/push/deploy.\n`);
    process.stdout.write(`  5. ACTIVE GUARD — read this one, it changes what Claude Code can do:\n`);
    process.stdout.write(`     .claude/hooks/delegation-guard.js blocks git commit, git push, ssh, scp,\n`);
    process.stdout.write(`     rsync and pm2 from Claude Code's MAIN LOOP. Only the \`sre\` agent may run\n`);
    process.stdout.write(`     them — which is what .claude/docs/processes.md + agents/sre.md already\n`);
    process.stdout.write(`     mandate. If Claude refuses to commit for you, THIS is why: ask it to\n`);
    process.stdout.write(`     delegate via the Agent tool with subagent_type=sre.\n`);
    process.stdout.write(`       Tune:    BLOCKED_COMMANDS at the top of .claude/hooks/delegation-guard.js\n`);
    process.stdout.write(`       Disable: remove the delegation-guard block from .claude/settings.json\n`);
    process.stdout.write(`       Details: README "Writing hooks" → "The delegation guard"\n`);
    process.stdout.write(`     (Your own shell is unaffected — hooks only apply inside Claude Code.)\n`);
    process.stdout.write(`  6. Customise .claude/hooks/post-tool-use.js with per-path nudges for your layout.\n`);
    process.stdout.write(`     Nudges must be emitted as additionalContext on stdout — stderr never reaches\n`);
    process.stdout.write(`     the model. See README "Writing hooks" before adding one.\n`);
    process.stdout.write(`  7. Restart Claude Code so hooks, agents, and skills pick up.\n`);
    process.stdout.write(`  8. Commit — run this yourself in a terminal (per step 5, Claude can't):\n`);
    process.stdout.write(`       git add -A && git commit -m "docs: bootstrap claude-docs-mgmt framework (${args.profile})"\n`);
  }
}

main();
