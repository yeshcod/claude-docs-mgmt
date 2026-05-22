#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  DIRS, readJsonStdin, readState, writeState, ensureDirs,
  parseTranscript, writeSessionFile, debugLog,
} = require('./_shared');

const CHECKPOINT_EVERY = 20;

(async function main() {
  try {
    ensureDirs();
    const input = await readJsonStdin();
    const sid = input?.session_id || 'unknown';
    const prompt = String(input?.prompt || '').slice(0, 1200);

    // Part A: mid-session checkpoint
    const stateAll = readState('checkpoint.json') || {};
    const s = stateAll[sid] || { messages: [], lastCheckpoint: 0, startTime: Date.now(), lastActivity: Date.now() };
    s.messages.push(prompt);
    s.lastActivity = Date.now();
    if (s.messages.length - s.lastCheckpoint >= CHECKPOINT_EVERY) {
      // Synthesize a parsed-like object so writeSessionFile works
      const parsed = {
        userMessages: s.messages.slice(-15),
        toolsUsed: new Set(),
        filesModified: new Set(),
        toolCalls: [],
      };
      // If transcript_path is present, prefer real parse
      if (input.transcript_path) {
        try {
          const p = parseTranscript(input.transcript_path);
          if (p.userMessages.length) Object.assign(parsed, p);
        } catch {}
      }
      writeSessionFile('checkpoint', parsed, { session_id: sid });
      s.lastCheckpoint = s.messages.length;
    }
    // prune inactive sessions ≥3d
    const cutoff = Date.now() - 3 * 24 * 3600 * 1000;
    for (const k of Object.keys(stateAll)) {
      if (stateAll[k]?.lastActivity && stateAll[k].lastActivity < cutoff) delete stateAll[k];
    }
    stateAll[sid] = s;
    writeState('checkpoint.json', stateAll);

    // Part B: memory-sync — surface MEMORY.md changes
    try {
      const memIndex = path.join(DIRS.memory, 'MEMORY.md');
      if (fs.existsSync(memIndex)) {
        const content = fs.readFileSync(memIndex, 'utf8');
        const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
        const last = readState('memory-sync.json') || {};
        if (last.hash !== hash) {
          const oldLines = new Set((last.content || '').split('\n'));
          const newLines = content.split('\n').filter((l) => l.trim() && !oldLines.has(l));
          if (newLines.length && last.hash) {
            process.stdout.write(`[memory] MEMORY.md changed since last turn:\n${newLines.slice(0, 10).map((l) => '  + ' + l).join('\n')}\n`);
          }
          writeState('memory-sync.json', { hash, content });
        }
      }

      // Pending handoffs
      const seen = new Set(readState('handoff-read.json') || []);
      const handoffs = fs.readdirSync(DIRS.memory).filter((f) => /^handoff-.+\.md$/.test(f));
      const unseen = handoffs.filter((f) => !seen.has(f));
      if (unseen.length) {
        process.stdout.write(`[memory] pending handoffs: ${unseen.join(', ')}\n`);
        for (const f of unseen) seen.add(f);
        writeState('handoff-read.json', [...seen]);
      }
    } catch (e) {
      debugLog(`memory-sync inner error: ${e.message}`, 'user-prompt-submit');
    }

    process.exit(0);
  } catch (e) {
    debugLog(`user-prompt-submit error: ${e.message}`, 'user-prompt-submit');
    process.exit(0);
  }
})();
