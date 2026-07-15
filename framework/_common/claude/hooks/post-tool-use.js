#!/usr/bin/env node
'use strict';

// Project-specific nudges after Edit/Write/NotebookEdit.
//
// This is the file most worth customising for your project. Add per-path
// reminders here so the assistant remembers adjacent checks: "you edited
// a DB schema — run a migration", "you edited a route — verify the
// matching test exists", "you edited an infra file — apply on the server".
//
// ⚠️ READ THIS BEFORE ADDING A NUDGE ────────────────────────────────────
// A PostToolUse hook that writes to STDERR and exits 0 reaches the
// transcript but NEVER enters the model's context — the assistant simply
// does not see it. It looks like it works. It does nothing.
//
// To actually nudge the model you must print a JSON envelope on STDOUT:
//
//   {"hookSpecificOutput":{"hookEventName":"PostToolUse",
//                          "additionalContext":"…your text…"}}
//
// `emitContext()` below does this for you — use it. See README
// "Writing hooks" for the full stdin/stdout contract.
// ────────────────────────────────────────────────────────────────────────
//
// Keep this file FAST: it runs after every single edit.

const path = require('path');
const { readJsonStdin, debugLog, PROJECT_DIR } = require('./_shared');

// The ONLY way to get text in front of the model from a PostToolUse hook.
function emitContext(notes) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: notes.map((n) => `- ${n}`).join('\n'),
      },
    }) + '\n'
  );
}

(async function main() {
  try {
    const input = await readJsonStdin();
    const tool = input?.tool_name;
    if (tool !== 'Edit' && tool !== 'Write' && tool !== 'NotebookEdit') return process.exit(0);
    const file = input.tool_input?.file_path || '';
    if (!file) return process.exit(0);

    // Project-relative path, e.g. ".claude/hooks/x.js" or "src/api/users.ts".
    // Always forward-slashed so the rules below are portable.
    const rel = path.relative(PROJECT_DIR, file).split(path.sep).join('/');

    const notes = [];

    // ─── Customise per project ────────────────────────────────────────
    // One live example, so you can see the shape of a working rule.
    // It is framework-intrinsic (every install has .claude/), so it is
    // safe to leave enabled — delete it if you find it noisy.
    if (/^\.claude\/(agents|skills|hooks)\//.test(rel)) {
      notes.push(
        `${rel} changed — agent/skill/hook config is loaded at session start; ` +
          `restart Claude Code for it to take effect.`
      );
    }

    // More examples (uncomment + adapt to your layout):
    //
    // if (/^src\/server\/db\//.test(rel)) {
    //   notes.push('DB code changed — run migrations + update .claude/docs/entities.md.');
    // }
    // if (/^src\/app\/api\//.test(rel)) {
    //   notes.push('API route changed — verify request validation + test coverage.');
    // }
    // if (/^infra\//.test(rel)) {
    //   notes.push('infra change — apply on the server (delegate to the sre agent).');
    // }
    // ──────────────────────────────────────────────────────────────────

    if (notes.length) emitContext(notes);
    process.exit(0);
  } catch (e) {
    debugLog(`post-tool-use error: ${e.message}`, 'post-tool-use');
    process.exit(0);
  }
})();
