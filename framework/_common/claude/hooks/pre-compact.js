#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
  PROJECT_DIR, DIRS, readJsonStdin, ensureDirs,
  parseTranscript, writeSessionFile, detectPitfalls, savePitfalls, debugLog,
} = require('./_shared');

(async function main() {
  try {
    ensureDirs();
    const input = await readJsonStdin();
    const trigger = input?.trigger || 'auto';

    // 1. Dirty-tree gate (only for manual /compact)
    if (trigger === 'manual') {
      const skipMarker = path.join(PROJECT_DIR, '.claude/.docs-sync-skip');
      if (fs.existsSync(skipMarker)) {
        try { fs.unlinkSync(skipMarker); } catch {}
      } else if (fs.existsSync(DIRS.docs)) {
        let dirty = '';
        try {
          dirty = execSync(`git -C "${PROJECT_DIR}" status --porcelain`, { encoding: 'utf8' });
        } catch {}
        if (dirty.trim()) {
          process.stderr.write(
            `BLOCKED: dirty working tree with .claude/docs/ framework present.\n` +
            `Run a docs-sync pass (route changes per .claude/docs/processes.md "Documentation Maintenance Rule"),\n` +
            `or one-shot bypass: touch .claude/.docs-sync-skip && /compact\n`,
          );
          process.exit(2);
        }
      }
    }

    // 2. Always do snapshot + pitfall detection
    if (input?.transcript_path) {
      const parsed = parseTranscript(input.transcript_path);
      if (parsed.userMessages.length) {
        writeSessionFile('compact', parsed, { session_id: input.session_id, trigger });
        const pitfalls = detectPitfalls(parsed);
        if (pitfalls.length) savePitfalls(pitfalls);
      }
    }
    process.exit(0);
  } catch (e) {
    debugLog(`pre-compact error: ${e.message}`, 'pre-compact');
    process.exit(0); // don't block on internal error
  }
})();
