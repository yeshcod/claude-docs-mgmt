#!/usr/bin/env node
'use strict';

// Project-specific nudges after Edit/Write/NotebookEdit.
//
// This is the file most worth customising for your project. Add per-path
// reminders here so the assistant remembers adjacent checks: "you edited
// a DB schema — run a migration", "you edited a route — verify the
// matching test exists", "you edited an infra file — apply on the server".
//
// Default behaviour: silent (no nudges). Add your own rules below.

const { readJsonStdin, debugLog } = require('./_shared');

(async function main() {
  try {
    const input = await readJsonStdin();
    const tool = input?.tool_name;
    if (tool !== 'Edit' && tool !== 'Write' && tool !== 'NotebookEdit') return process.exit(0);
    const file = input.tool_input?.file_path || '';
    if (!file) return process.exit(0);

    const notes = [];
    const rel = file.replace(/^.*?\/(?=[^/]+\/[^/]+$)/, ''); // last 2 segments

    // ─── Customise per project ────────────────────────────────────────
    // Examples (uncomment + adapt to your layout):
    //
    // if (/\/src\/server\/db\//.test(file)) {
    //   notes.push('DB code changed — run migrations + update entities.md.');
    // }
    // if (/\/src\/app\/api\//.test(file)) {
    //   notes.push('API route changed — verify zod validation + test coverage.');
    // }
    // if (/^infra\//.test(rel)) {
    //   notes.push('infra change — apply on the server (git pull + docker compose up -d).');
    // }
    // if (/^\.claude\/(skills|agents|hooks)\//.test(rel)) {
    //   notes.push('agent/skill/hook config edited — restart Claude Code session to pick up.');
    // }
    // ──────────────────────────────────────────────────────────────────

    if (notes.length) {
      process.stderr.write('[project]\n' + notes.map((n) => `- ${n}`).join('\n') + '\n');
    }
    process.exit(0);
  } catch (e) {
    debugLog(`post-tool-use error: ${e.message}`, 'post-tool-use');
    process.exit(0);
  }
})();
