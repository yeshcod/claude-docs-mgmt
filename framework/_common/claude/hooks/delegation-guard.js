#!/usr/bin/env node
'use strict';

// Delegation guard (PreToolUse / Bash) — enforces the processes.md rule
// "the SRE agent owns commit + deploy; the orchestrator never commits".
//
// Without this hook that rule is a suggestion. With it, the commands are
// simply unavailable outside the `sre` agent, so the pipeline holds even
// when nobody is watching.
//
// ── HOW IT WORKS ────────────────────────────────────────────────────────
// Claude Code sends every hook a JSON payload on STDIN (there is no
// $CLAUDE_TOOL_INPUT env var — see README "Writing hooks"). PreToolUse/Bash
// payloads carry `tool_input.command` plus `agent_type`: the name of the
// subagent making the call, or null/absent for the main loop. That is the
// whole mechanism — we read the command, and exempt the `sre` agent.
//
// Blocking REQUIRES `exit 2`. `exit 1` is a non-blocking error: it prints
// and lets the command run anyway. Exit 2 sends stderr back to the model
// so it can self-correct (here: "delegate this to the sre agent").
//
// ── FAIL OPEN ───────────────────────────────────────────────────────────
// This is a workflow-convention guard, NOT a security boundary. Any
// unexpected payload shape, parse failure, or internal error => exit 0
// (allow). A bug in this file must never be able to wedge a session.
// The real security layer is pre-tool-use.js (secret files, rm -rf); it
// is deliberately separate and untouched by this guard.
//
// ── TO DISABLE ──────────────────────────────────────────────────────────
// Remove the delegation-guard block from .claude/settings.json (PreToolUse),
// or delete this file. To tune what it blocks, edit BLOCKED_COMMANDS below.

const { readJsonStdin, debugLog } = require('./_shared');

// ── TUNE ME ─────────────────────────────────────────────────────────────
// Bare commands that only the `sre` agent may run. Matched at COMMAND
// POSITION only (see AT_CMD_START), so `grep ssh notes.txt` is fine.
const BLOCKED_COMMANDS = [
  // Remote access + file transfer — how a deploy usually reaches a server.
  'ssh',
  'scp',
  'rsync',

  // Deploy / process management. STACK-SPECIFIC — tune for your project.
  // Uncomment what your deploys actually use; delete what they don't.
  'pm2',
  // 'docker',    // ⚠️ also a routine LOCAL-dev command (docker ps, compose up).
  //              //   Enabling this blocks everyday work, not just deploys.
  // 'kubectl',
  // 'fly',
  // 'vercel',
  // 'terraform',
];

// Subagents allowed to run the blocked commands. `sre` ships with this
// framework and owns commit + deploy end to end.
const EXEMPT_AGENTS = new Set(['sre']);
// ── END TUNE ME ─────────────────────────────────────────────────────────

// Anchor at command position: start of string, or after a shell separator
// (; & | newline), a subshell opener ( / $( , or a backtick. This is what
// keeps `grep ssh notes.txt` and `echo 'git push'` from tripping the guard,
// while still catching `cd /x && git push` and `$(ssh host)`.
const AT_CMD_START = String.raw`(?:^|[\n;&|(\`]|\$\()\s*(?:sudo\s+)?`;

const cmdRe = (tail) => new RegExp(AT_CMD_START + tail);

// BLOCKED_COMMANDS is hand-edited, so escape it rather than trusting it to
// be regex-safe.
const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// git tolerates leading flags before the subcommand:
//   git -C /path commit, git --no-pager push
const GIT_LEADING_FLAGS = String.raw`(?:-[cC]\s+\S+\s+|--\S+\s+)*`;

const POLICY = [
  // Commits + pushes are structural (git + optional flags + subcommand),
  // not bare words, so they are matched separately from BLOCKED_COMMANDS.
  { re: cmdRe(String.raw`git\s+${GIT_LEADING_FLAGS}commit\b`), what: 'git commit' },
  { re: cmdRe(String.raw`git\s+${GIT_LEADING_FLAGS}push\b`), what: 'git push' },
  ...BLOCKED_COMMANDS.map((c) => ({ re: cmdRe(String.raw`${escapeRe(c)}\b`), what: c })),
];

function findViolation(cmd) {
  for (const p of POLICY) {
    if (p.re.test(cmd)) return p.what;
  }
  return null;
}

(async function main() {
  try {
    const input = await readJsonStdin();
    if (input?.tool_name !== 'Bash') return process.exit(0);

    const cmd = input.tool_input?.command;
    if (typeof cmd !== 'string' || !cmd) return process.exit(0);

    const violation = findViolation(cmd);
    if (!violation) return process.exit(0);

    // The sre subagent owns commit + deploy — that is its entire job.
    if (EXEMPT_AGENTS.has(input.agent_type)) return process.exit(0);

    process.stderr.write(
      `BLOCKED: "${violation}" is reserved for the sre agent.\n` +
        `Reason: .claude/docs/processes.md — the SRE agent owns commit, push, and deploy; ` +
        `the orchestrator never commits.\n` +
        `Fix: delegate this via the Agent tool with subagent_type=sre, ` +
        `describing what to commit/deploy and why.\n` +
        `(To tune or disable this guard: .claude/hooks/delegation-guard.js — see README "Writing hooks".)\n`
    );
    // exit 2 = BLOCK. exit 1 would be a non-blocking error — the command
    // would still run. See README "Writing hooks".
    process.exit(2);
  } catch (e) {
    // FAIL OPEN — never let a guard bug wedge the session.
    debugLog(`delegation-guard error: ${e.message}`, 'delegation-guard');
    process.exit(0);
  }
})();
