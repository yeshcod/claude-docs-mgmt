'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

const DIRS = {
  hooks: path.join(PROJECT_DIR, '.claude/hooks'),
  sessions: path.join(PROJECT_DIR, '.claude/sessions'),
  learned: path.join(PROJECT_DIR, '.claude/learned'),
  state: path.join(PROJECT_DIR, '.claude/state'),
  memory: path.join(PROJECT_DIR, '.claude/memory'),
  docs: path.join(PROJECT_DIR, '.claude/docs'),
};

function detectProjectTag() {
  // 1. package.json name (strip @scope/)
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_DIR, 'package.json'), 'utf8'));
    if (pkg.name) return String(pkg.name).replace(/^@[^/]+\//, '');
  } catch {}
  // 2. git remote
  try {
    const url = execSync(`git -C "${PROJECT_DIR}" config --get remote.origin.url`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    const m = url.match(/[:/]([^/]+?)(\.git)?$/);
    if (m) return m[1];
  } catch {}
  // 3. basename of project dir
  return path.basename(PROJECT_DIR) || 'project';
}

const PROJECT_TAG = detectProjectTag();
const MAX_SESSIONS = 30;

function ensureDirs() {
  for (const d of Object.values(DIRS)) {
    fs.mkdirSync(d, { recursive: true });
  }
}

function readJsonStdin() {
  return new Promise((resolve) => {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (buf += c));
    process.stdin.on('end', () => {
      if (!buf.trim()) return resolve({});
      try {
        resolve(JSON.parse(buf));
      } catch {
        resolve({ _raw: buf });
      }
    });
    setTimeout(() => resolve({}), 50).unref?.();
  });
}

function dateStamp(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function timeStamp(d = new Date()) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function shortId(sessionId) {
  if (!sessionId) return crypto.randomBytes(4).toString('hex');
  return String(sessionId).replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'noid';
}

function debugLog(msg, prefix = 'hook') {
  try {
    ensureDirs();
    fs.appendFileSync(
      path.join(DIRS.sessions, 'debug.log'),
      `[${new Date().toISOString()}] [${prefix}] ${msg}\n`,
    );
  } catch {}
}

const SYSTEM_NOISE = [
  /<system-reminder>[\s\S]*?<\/system-reminder>/g,
  /<ide_[^>]+>[\s\S]*?<\/ide_[^>]+>/g,
  /The user opened the file [^\n]+ in the IDE\.[^\n]*/g,
  /The following deferred tools[\s\S]*?(?=\n\n|\Z)/g,
];
function stripNoise(s) {
  if (!s) return '';
  let out = String(s);
  for (const re of SYSTEM_NOISE) out = out.replace(re, '');
  return out.trim();
}

const ERROR_RE = /\b(error|Error|ERROR|failed|Failed|FAILED|not found|does not exist|TypeError|SyntaxError|cannot|Cannot)\b/;
const SKIP_RETRY_TOOLS = new Set(['TodoWrite', 'Agent', 'Read', 'Grep', 'Glob', 'WebSearch', 'WebFetch']);
const CORRECTION_RE = /\b(wrong|not that|revert|undo|неправильно|не так|не то|откати|верни|это не то|стоп)\b/i;

function parseTranscript(transcriptPath) {
  const result = { userMessages: [], toolsUsed: new Set(), filesModified: new Set(), toolCalls: [] };
  let raw;
  try {
    raw = fs.readFileSync(transcriptPath, 'utf8');
  } catch (e) {
    debugLog(`transcript read failed: ${e.message}`, 'parseTranscript');
    return result;
  }
  const lines = raw.split('\n').filter(Boolean);
  for (const line of lines) {
    let obj;
    try { obj = JSON.parse(line); } catch { continue; }
    if (obj.type === 'user' && obj.message?.content) {
      const c = obj.message.content;
      const txt = Array.isArray(c)
        ? c.filter((p) => p?.type === 'text').map((p) => p.text).join('\n')
        : typeof c === 'string' ? c : '';
      const cleaned = stripNoise(txt);
      if (cleaned) result.userMessages.push(cleaned.slice(0, 1200));
    }
    if (obj.type === 'assistant' && Array.isArray(obj.message?.content)) {
      for (const p of obj.message.content) {
        if (p?.type === 'tool_use') {
          const tool = p.name;
          result.toolsUsed.add(tool);
          const target =
            p.input?.file_path || p.input?.path || p.input?.pattern || p.input?.command || p.input?.url || '';
          result.toolCalls.push({ id: p.id, name: tool, target: String(target).slice(0, 200), hasError: false, resultSnippet: '' });
          if ((tool === 'Edit' || tool === 'Write' || tool === 'NotebookEdit') && p.input?.file_path) {
            result.filesModified.add(path.basename(p.input.file_path));
          }
        }
      }
    }
    if (obj.type === 'user' && Array.isArray(obj.message?.content)) {
      for (const p of obj.message.content) {
        if (p?.type === 'tool_result') {
          const call = result.toolCalls.find((c) => c.id === p.tool_use_id);
          if (call) {
            const content = Array.isArray(p.content)
              ? p.content.map((x) => (typeof x === 'string' ? x : x?.text || '')).join('\n')
              : typeof p.content === 'string' ? p.content : '';
            call.resultSnippet = String(content).slice(0, 300);
            call.hasError = !!p.is_error || ERROR_RE.test(call.resultSnippet);
          }
        }
      }
    }
  }
  return result;
}

function detectPitfalls(parsed) {
  const out = [];
  const counts = new Map();
  for (const c of parsed.toolCalls) {
    if (SKIP_RETRY_TOOLS.has(c.name) || !c.target) continue;
    const key = `${c.name}:${c.target}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  for (const [key, n] of counts) {
    if (n >= 5) {
      const [tool, target] = key.split(':');
      out.push({ type: 'retry', description: `${tool} repeated ${n}× on ${target}`, target });
    }
  }
  const byKey = new Map();
  for (const c of parsed.toolCalls) {
    const key = `${c.name}:${c.target}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(c);
  }
  for (const [, arr] of byKey) {
    const firstErrIdx = arr.findIndex((x) => x.hasError);
    if (firstErrIdx === -1) continue;
    const laterOk = arr.slice(firstErrIdx + 1).some((x) => !x.hasError);
    if (laterOk) {
      const errCall = arr[firstErrIdx];
      out.push({
        type: 'error-then-fix',
        description: `${errCall.name} on ${errCall.target} errored then succeeded later`,
        target: errCall.target,
        errorSnippet: errCall.resultSnippet.slice(0, 150),
      });
    }
  }
  for (const m of parsed.userMessages) {
    if (CORRECTION_RE.test(m)) {
      out.push({ type: 'user-correction', description: m.slice(0, 200) });
      break;
    }
  }
  return out;
}

function savePitfalls(arr) {
  if (!arr || !arr.length) return null;
  ensureDirs();
  const today = dateStamp().replace(/-/g, '');
  let file = path.join(DIRS.learned, `auto-pitfall-${today}.md`);
  let seq = 0;
  while (fs.existsSync(file) && fs.statSync(file).size > 8000) {
    seq += 1;
    file = path.join(DIRS.learned, `auto-pitfall-${today}-${seq}.md`);
  }
  const header = fs.existsSync(file) ? '' : `# Pitfall Record ${dateStamp()}\n\n`;
  let body = '## Detected Issues\n\n';
  for (const p of arr) {
    body += `### ${p.type}\n- ${p.description}\n`;
    if (p.errorSnippet) body += `- error snippet: \`${p.errorSnippet.replace(/`/g, "'")}\`\n`;
    body += '\n';
  }
  fs.appendFileSync(file, header + body);
  return file;
}

function updateProjectIndex(date, time, title, filename, label = '') {
  ensureDirs();
  const indexPath = path.join(DIRS.sessions, 'project-index.md');
  const tag = PROJECT_TAG;
  let content = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '# Project Session Index\n\n> Auto-maintained.\n\n';
  const sectionRe = new RegExp(`(## ${tag}\\n)([\\s\\S]*?)(\\n## |$)`, 'm');
  const labelStr = label ? `[${label}] ` : '';
  const line = `- ${date} ${time} | ${labelStr}${title} | ${filename}`;
  const m = content.match(sectionRe);
  if (m) {
    const entries = m[2].split('\n').filter((l) => l.startsWith('- '));
    entries.unshift(line);
    const trimmed = entries.slice(0, 20).join('\n') + '\n';
    content = content.replace(sectionRe, `## ${tag}\n${trimmed}${m[3]}`);
  } else {
    content += `## ${tag}\n${line}\n`;
  }
  fs.writeFileSync(indexPath, content);
}

function writeSessionFile(kind, parsed, meta) {
  ensureDirs();
  const d = new Date();
  const date = dateStamp(d);
  const time = timeStamp(d);
  const sid = shortId(meta.session_id);
  const filename = `${date}-${sid}-${kind}.md`;
  const filepath = path.join(DIRS.sessions, filename);
  const titleSrc = parsed.userMessages.slice(0, 5).join(' ').replace(/\s+/g, ' ').slice(0, 80) || 'untitled';
  const kindLabel = { session: 'Session', compact: 'Compact Snapshot', checkpoint: 'Checkpoint' }[kind] || kind;
  let body = `# ${kindLabel}: ${date}\n\n`;
  body += `**Project:** ${PROJECT_TAG}\n`;
  body += `**Title:** ${titleSrc}\n`;
  body += `**Time:** ${time}\n`;
  body += `**Messages:** ${parsed.userMessages.length}\n`;
  if (meta.trigger) body += `**Trigger:** ${meta.trigger}\n`;
  body += `**Type:** ${kindLabel}\n\n`;
  body += `## User Requests\n`;
  for (const m of parsed.userMessages.slice(-10)) {
    body += `- ${m.replace(/\n/g, ' ').slice(0, 200)}\n`;
  }
  body += `\n## Tools Used\n`;
  body += [...parsed.toolsUsed].sort().join(', ') + '\n\n';
  if (parsed.filesModified.size) {
    body += `## Files Modified\n`;
    for (const f of [...parsed.filesModified].sort()) body += `- ${f}\n`;
    body += '\n';
  }
  fs.writeFileSync(filepath, body);
  updateProjectIndex(date, time, titleSrc, filename, kind === 'compact' ? 'compact' : kind === 'checkpoint' ? 'mid' : '');
  return filepath;
}

function pruneSessions(maxKeep = MAX_SESSIONS) {
  try {
    const files = fs.readdirSync(DIRS.sessions)
      .filter((f) => /-session\.md$/.test(f))
      .map((f) => ({ f, t: fs.statSync(path.join(DIRS.sessions, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    for (const { f } of files.slice(maxKeep)) {
      try { fs.unlinkSync(path.join(DIRS.sessions, f)); } catch {}
    }
  } catch {}
}

function readState(name) {
  const file = path.join(DIRS.state, name);
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}
function writeState(name, data) {
  ensureDirs();
  fs.writeFileSync(path.join(DIRS.state, name), JSON.stringify(data, null, 2));
}

module.exports = {
  PROJECT_DIR,
  PROJECT_TAG,
  DIRS,
  MAX_SESSIONS,
  ensureDirs,
  readJsonStdin,
  dateStamp,
  timeStamp,
  shortId,
  debugLog,
  parseTranscript,
  detectPitfalls,
  savePitfalls,
  updateProjectIndex,
  writeSessionFile,
  pruneSessions,
  readState,
  writeState,
};
