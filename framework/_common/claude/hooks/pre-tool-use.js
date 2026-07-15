#!/usr/bin/env node
'use strict';

const path = require('path');
const { readJsonStdin, debugLog } = require('./_shared');

// Match TRUE secret files only — not legitimate source files whose basename
// merely contains a word like "password"/"credentials"/"secret" (e.g.
// updatePassword.js, updateProfilePassword.js, PasswordModal.jsx, secrets.test.js).
// Blocks: dotenv files, private-key material (.pem/.key/.p12/.pfx/id_rsa[...]),
// and secret-data files (credentials/secret(s)/password) ONLY when the extension
// is a data/config format (json/yml/yaml/txt/ini/conf/env) or there is no
// extension — never when it's a code extension (js/jsx/ts/tsx/mjs/cjs/vue/...).
const SECRET_DATA_EXT = '(?:json|ya?ml|txt|ini|conf|cfg|env|pem|key|cert|crt)';
const SECRET_FILE_RE = new RegExp(
  '(^|/)(' +
    // dotenv: .env, .env.production, etc.
    '\\.env(\\..*)?' +
    // private-key / cert material by extension
    '|.*\\.(?:pem|key|p12|pfx|asc)' +
    // ssh private keys
    '|id_rsa(\\..*)?|id_ed25519(\\..*)?|id_ecdsa(\\..*)?' +
    // secret-data files: word-bearing name BUT only with a data extension or none
    `|.*(?:credentials|secrets?|password)[^/]*\\.${SECRET_DATA_EXT}` +
    '|.*(?:credentials|secrets?|password)[^/.]*' + // extension-less (e.g. ".credentials")
    ')$',
  'i'
);
const NOISY_DOC_RE = /^(README|CHANGELOG|TODO)\.md$/i;
const ALLOW_PATHS = [/\/\.env\.example$/, /\/infra\/\.env\.example$/];

function isAllowed(p) {
  return ALLOW_PATHS.some((re) => re.test(p));
}

(async function main() {
  try {
    const input = await readJsonStdin();
    const tool = input?.tool_name;
    if (!tool) return process.exit(0);

    // Edit / Write / NotebookEdit guard
    if (tool === 'Edit' || tool === 'Write' || tool === 'NotebookEdit') {
      const file = input.tool_input?.file_path || '';
      const base = path.basename(file);
      if (SECRET_FILE_RE.test(file) && !isAllowed(file)) {
        process.stderr.write(`BLOCKED: ${base} looks like a secret file. Ask the user to edit it manually.\n`);
        process.exit(2);
      }
      if (NOISY_DOC_RE.test(base)) {
        // non-blocking nudge: is this needed?
        process.stderr.write(`note: editing ${base} — verify a section of .claude/docs/ wouldn't be a better home (per processes.md routing).\n`);
      }
      return process.exit(0);
    }

    // Bash guard
    if (tool === 'Bash') {
      const cmd = input.tool_input?.command || '';
      // Commit/push policy is NOT here: delegation-guard.js (a separate
      // PreToolUse/Bash hook) blocks git commit / git push / ssh / scp /
      // rsync / pm2 outside the `sre` agent. This file is the security
      // layer — secret files and catastrophic rm. Keep the two separate:
      // this one must stay conservative, that one is meant to be tuned.
      if (/\bgit\s+push\b.*(\s-f\b|\s--force\b)/.test(cmd)) {
        process.stderr.write(`note: detected force push. Ensure user authorised this.\n`);
      }
      // Block catastrophic rm only when rm is the actual command (start of line or after ; && ||),
      // not when it appears as substring in a quoted echo etc. Targets: /, /*, /etc, /usr, /var, /opt,
      // /bin, /home, /root, /System, /Library, ~, ~/.
      const RM_CATASTROPHIC = /(?:^|[;&|]\s*)rm\s+-[rfRF]+\s+(\/(?:\s|$|\*|etc\b|usr\b|var\b|opt\b|bin\b|home\b|root\b|System\b|Library\b)|~(?:\/?(?:\s|$)))/;
      if (RM_CATASTROPHIC.test(cmd)) {
        process.stderr.write(`BLOCKED: dangerous rm -rf target. Ask user to confirm.\n`);
        process.exit(2);
      }
      return process.exit(0);
    }

    process.exit(0);
  } catch (e) {
    debugLog(`pre-tool-use error: ${e.message}`, 'pre-tool-use');
    process.exit(0);
  }
})();
