import * as fs from 'node:fs';
import * as path from 'node:path';
import type { CheckResult } from '../types.js';

// High-confidence standalone token shapes. These are always flagged when matched.
const TOKEN_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: 'AWS Access Key', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'Private Key', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: 'GitHub Token', re: /gh[pousr]_[a-zA-Z0-9]{20,}/ },
  { name: 'GitHub Fine-grained Token', re: /github_pat_[a-zA-Z0-9_]{20,}/ },
  { name: 'npm Token', re: /npm_[a-zA-Z0-9]{20,}/ },
  { name: 'Slack Token', re: /xox[baprs]-[a-zA-Z0-9-]{10,}/ },
  { name: 'OpenAI Key', re: /sk-[a-zA-Z0-9]{20,}/ },
  { name: 'Google API Key', re: /AIza[0-9A-Za-z_\-]{35}/ },
];

// Generic `key = value` assignments. Flagged only when the value does not look
// like a documentation placeholder (e.g. YOUR_TOKEN, <api-key>, changeme).
const ASSIGNMENT_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: 'API Key assignment', re: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?([^\s'"]{20,})/i },
  { name: 'Token/Secret assignment', re: /(?:token|secret|password|passwd|pwd)\s*[:=]\s*['"]?([^\s'"]{8,})/i },
];

const PLACEHOLDER_RE = /^(?:[<{].*[>}]|\.{3,}|x{3,}|your[_-]|my[_-]|changeme|placeholder|replace|example|todo|\$\{|env\.|process\.env)/i;

function isPlaceholder(value: string): boolean {
  if (PLACEHOLDER_RE.test(value)) return true;
  // ALL_CAPS_PLACEHOLDER — a YOUR_TOKEN / ALL_CAPS_VALUE style doc placeholder.
  // The old blanket /^[A-Z][A-Z0-9_]+$/ also swallowed a whole class of REAL
  // all-caps secrets (base32 tokens, upper-hex, some cloud secrets), so a committed
  // secret of that shape passed the scan silently (assay R2). Keep the exemption
  // only for values that actually look word-like: a WORD_WORD form (carries an
  // underscore) or a plain CAPS word (no digits). A high-entropy all-caps value
  // that MIXES letters and digits with NO separating underscore is token-shaped,
  // not a placeholder, and is no longer exempted.
  if (/^[A-Z][A-Z0-9_]*$/.test(value)) {
    return value.includes('_') || !/[0-9]/.test(value);
  }
  return false;
}

export async function noSecretsCheck(targetPath: string): Promise<CheckResult> {
  const filePath = path.resolve(targetPath, 'SKILL.md');

  if (!fs.existsSync(filePath)) {
    return { status: 'fail', message: 'SKILL.md not found' };
  }

  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  const findings: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const pattern of TOKEN_PATTERNS) {
      if (pattern.re.test(line)) {
        findings.push(`L${i + 1}: ${pattern.name}`);
      }
    }

    for (const pattern of ASSIGNMENT_PATTERNS) {
      const m = pattern.re.exec(line);
      if (m && !isPlaceholder(m[1])) {
        findings.push(`L${i + 1}: ${pattern.name}`);
      }
    }
  }

  if (findings.length > 0) {
    return { status: 'fail', message: findings.join(', ') };
  }

  return { status: 'pass', message: 'no secret patterns detected' };
}
