#!/usr/bin/env node
'use strict';

const path = require('path');
const { readJsonStdin, debugLog } = require('./_shared');

const SECRET_FILE_RE = /(^|\/)(\.env(\..*)?|.*credentials.*|.*\.secret.*|.*password.*|.*\.pem|.*\.key)$/i;
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
      if (/\bgit\s+(commit|push)\b/.test(cmd) && process.env.CONTENT_OPS_ALLOW_GIT !== '1') {
        // Per feedback-auto-commit-on-slice: commits are OK at slice boundaries.
        // We don't block commits — just warn on force pushes / pushes to non-main if needed.
      }
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
