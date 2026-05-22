#!/usr/bin/env node
'use strict';

const {
  readJsonStdin, ensureDirs, parseTranscript, writeSessionFile, pruneSessions, debugLog,
} = require('./_shared');

(async function main() {
  try {
    ensureDirs();
    const input = await readJsonStdin();
    if (!input?.transcript_path) {
      debugLog('no transcript_path on Stop', 'session-end');
      return;
    }
    const parsed = parseTranscript(input.transcript_path);
    if (parsed.userMessages.length === 0) return; // empty session
    writeSessionFile('session', parsed, { session_id: input.session_id });
    pruneSessions();
  } catch (e) {
    debugLog(`session-end error: ${e.message}`, 'session-end');
  }
})();
