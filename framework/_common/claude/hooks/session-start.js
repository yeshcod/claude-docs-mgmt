#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  DIRS, ensureDirs, dateStamp, debugLog, readState,
} = require('./_shared');

(async function main() {
  try {
    ensureDirs();
    const out = [];

    // 1. Pending handoffs
    try {
      const seen = (readState('handoff-read.json') || []);
      const handoffs = fs.readdirSync(DIRS.memory)
        .filter((f) => /^handoff-.+\.md$/.test(f))
        .filter((f) => !seen.includes(f));
      if (handoffs.length) {
        out.push('## Pending handoffs');
        for (const f of handoffs) {
          out.push(`- ${f}`);
        }
        out.push('');
      }
    } catch {}

    // 2. Latest session within 7 days
    try {
      const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
      const sess = fs.readdirSync(DIRS.sessions)
        .filter((f) => /-(session|compact|checkpoint)\.md$/.test(f))
        .map((f) => ({ f, t: fs.statSync(path.join(DIRS.sessions, f)).mtimeMs }))
        .filter((x) => x.t >= cutoff)
        .sort((a, b) => b.t - a.t);
      if (sess.length) {
        const top = sess[0];
        const preview = fs.readFileSync(path.join(DIRS.sessions, top.f), 'utf8').split('\n').slice(0, 20).join('\n');
        out.push(`## Last session (${top.f})`);
        out.push(preview);
        out.push('');
      }
    } catch {}

    // 3. Current context (current.md)
    try {
      const cur = path.join(DIRS.memory, 'current.md');
      if (fs.existsSync(cur)) {
        out.push('## Current context');
        out.push(fs.readFileSync(cur, 'utf8'));
        out.push('');
      }
    } catch {}

    // 4. TODO status
    try {
      const todo = path.join(DIRS.memory, 'todo-status.md');
      if (fs.existsSync(todo)) {
        const content = fs.readFileSync(todo, 'utf8');
        const open = (content.match(/^- \[ \]/gm) || []).length;
        const done = (content.match(/^- \[x\]/gmi) || []).length;
        out.push(`## TODOs: ${open} open / ${done} done`);
        out.push('');
      }
    } catch {}

    // 5. Recent memory edits (<24h)
    try {
      const cutoff = Date.now() - 24 * 3600 * 1000;
      const recent = fs.readdirSync(DIRS.memory)
        .filter((f) => f.endsWith('.md') && f !== 'MEMORY.md')
        .filter((f) => fs.statSync(path.join(DIRS.memory, f)).mtimeMs >= cutoff);
      if (recent.length) {
        out.push('## Memory edited <24h');
        for (const f of recent) out.push(`- ${f}`);
        out.push('');
      }
    } catch {}

    // 6. Recent pitfalls + recurring detection
    try {
      const cutoff = Date.now() - 3 * 24 * 3600 * 1000;
      const pitfalls = fs.readdirSync(DIRS.learned)
        .filter((f) => /^auto-pitfall-.+\.md$/.test(f))
        .map((f) => ({ f, t: fs.statSync(path.join(DIRS.learned, f)).mtimeMs }))
        .filter((x) => x.t >= cutoff)
        .sort((a, b) => b.t - a.t);
      if (pitfalls.length) {
        out.push('## Recent pitfalls (<3d)');
        out.push(`Newest: ${pitfalls[0].f}`);
        out.push('Review and avoid the same patterns this session.');
        out.push('');
      }
      // recurring: parse all auto-pitfall files, count distinct dates per type
      const all = fs.readdirSync(DIRS.learned).filter((f) => /^auto-pitfall-/.test(f));
      const dateByType = new Map();
      for (const f of all) {
        const dateM = f.match(/auto-pitfall-(\d{4})(\d{2})(\d{2})/);
        if (!dateM) continue;
        const date = `${dateM[1]}-${dateM[2]}-${dateM[3]}`;
        const body = fs.readFileSync(path.join(DIRS.learned, f), 'utf8');
        for (const m of body.matchAll(/^### (retry|error-then-fix|user-correction)/gm)) {
          const t = m[1];
          if (!dateByType.has(t)) dateByType.set(t, new Set());
          dateByType.get(t).add(date);
        }
      }
      const recurring = [...dateByType.entries()].filter(([, s]) => s.size >= 3).map(([t, s]) => `${t} (${s.size} days)`);
      if (recurring.length) {
        out.push('## Recurring pitfalls — consider promoting to a CLAUDE.md rule');
        out.push(`- ${recurring.join(', ')}`);
        out.push('');
      }
    } catch {}

    // 7. Reflect reminder
    try {
      const reflectFiles = fs.readdirSync(DIRS.sessions).filter((f) => /^reflect-\d{4}-\d{2}-\d{2}\.md$/.test(f));
      if (reflectFiles.length === 0) {
        out.push('## Reflect: never run. Run sub-agent "memory-reflect" when you have ~7 days of sessions.');
      } else {
        const newest = reflectFiles.sort().pop();
        const dateM = newest.match(/reflect-(\d{4}-\d{2}-\d{2})/);
        if (dateM) {
          const days = Math.floor((Date.now() - new Date(dateM[1]).getTime()) / (24 * 3600 * 1000));
          if (days >= 7) {
            out.push(`## Reflect last ran ${days}d ago — run memory-reflect sub-agent to refine notes.`);
          }
        }
      }
      out.push('');
    } catch {}

    // 8. Docs framework presence reminder
    try {
      if (fs.existsSync(DIRS.docs)) {
        out.push('## Docs framework');
        out.push('`.claude/docs/` is live. Before /compact or /clear, run a docs sync pass (see processes.md "Documentation Maintenance Rule").');
      }
    } catch {}

    process.stdout.write(out.filter((l) => l !== undefined).join('\n'));
  } catch (e) {
    debugLog(`session-start error: ${e.message}`, 'session-start');
  }
})();
