import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
import type { ChecklistConfig, Phase, CheckItem } from './types.js';

const CONFIG_FILE = '.checklist.yml';

// Ceiling for a per-check sensor `timeout` (seconds). Generous enough for a real
// project's full test suite / build / scan, but bounded so a gate sensor can
// never hang the agent indefinitely. 30 minutes.
const MAX_TIMEOUT_SECONDS = 1800;

export function loadChecklist(dir: string): ChecklistConfig {
  const filePath = path.resolve(dir, CONFIG_FILE);

  if (!fs.existsSync(filePath)) {
    // Agents naturally point checklist at the project they are working on, but
    // a checklist lives in the *skill* directory (next to SKILL.md). Redirect
    // instead of dead-ending.
    const skillHint = process.env.CLAUDE_SKILL_DIR
      ? `\n  this skill's dir is: ${process.env.CLAUDE_SKILL_DIR}\n  try: checklist init "${process.env.CLAUDE_SKILL_DIR}"`
      : `\n  a checklist lives in the skill directory (next to SKILL.md), not your project/working dir.\n  try: checklist init <skill-dir>`;
    throw new Error(`${CONFIG_FILE} not found in ${dir}${skillHint}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = yaml.load(raw) as Record<string, unknown>;

  if (!data || typeof data !== 'object') {
    throw new Error(`${CONFIG_FILE} is empty or not a valid YAML object`);
  }

  if (!Array.isArray(data.phases)) {
    throw new Error(`${CONFIG_FILE} missing "phases" array`);
  }

  const phases: Phase[] = data.phases.map((p: unknown, i: number) => {
    // A null entry ("- " / "- null") or any other non-mapping slips past the
    // bare cast (typeof null === 'object') and used to crash downstream with a
    // raw, unlocated TypeError. Reject it here with the same located error
    // style every other malformed-structure path uses.
    if (!p || typeof p !== 'object' || Array.isArray(p)) {
      throw new Error(`Phase ${i}: entry must be a mapping with "name" and "checks"`);
    }
    const phase = p as Record<string, unknown>;
    if (!phase.name || typeof phase.name !== 'string') {
      throw new Error(`Phase ${i}: missing "name" field`);
    }
    if (!Array.isArray(phase.checks)) {
      throw new Error(`Phase "${phase.name}": missing "checks" array`);
    }
    if (phase.checks.length === 0) {
      // A phase with no checks is vacuously gate-complete (`[].every` is true),
      // letting an empty stage pass with zero work. The format is documented as
      // a non-empty checks list, so reject it at the parse boundary.
      throw new Error(`Phase "${phase.name}": "checks" array is empty`);
    }

    const checks: CheckItem[] = phase.checks.map((c: unknown, j: number) => {
      if (!c || typeof c !== 'object' || Array.isArray(c)) {
        throw new Error(`Phase "${phase.name}", check ${j}: entry must be a mapping with "id" and "description"`);
      }
      const check = c as Record<string, unknown>;
      if (!check.id || typeof check.id !== 'string') {
        throw new Error(`Phase "${phase.name}", check ${j}: missing "id"`);
      }
      if (!check.description || typeof check.description !== 'string') {
        throw new Error(`Phase "${phase.name}", check "${check.id}": missing "description"`);
      }
      // A present-but-non-string verify (a YAML indentation mistake turns it
      // into a nested mapping; "verify:" with no value turns it into null) used
      // to be silently coerced to undefined — demoting a MECHANICAL check to a
      // self-certifiable manual one. Refuse to load instead.
      const verify = check.verify;
      if (verify !== undefined && typeof verify !== 'string') {
        throw new Error(`Phase "${phase.name}", check "${check.id}": "verify" must be a string`);
      }
      // Per-item opt-in for required evidence. The only accepted value is the
      // literal string "required" (mirroring `evidence: required` in the docs).
      // A truthy-but-wrong value (a typo, a YAML indentation mistake turning it
      // into a mapping, a stray boolean) is rejected at the parse boundary
      // rather than silently treated as "not required" — the same refuse-to-load
      // posture the loader takes for a malformed `verify`. A check with both
      // `verify` and `evidence: required` is also rejected: a mechanical check
      // is cleared by `verify`, never by `check --evidence`, so the combination
      // can never be satisfied and almost certainly signals a config mistake.
      const evidence = check.evidence;
      let evidenceRequired = false;
      if (evidence !== undefined) {
        if (evidence !== 'required') {
          throw new Error(`Phase "${phase.name}", check "${check.id}": "evidence" may only be the string "required"`);
        }
        if (verify !== undefined) {
          throw new Error(`Phase "${phase.name}", check "${check.id}": "evidence: required" is for manual checks; this check has a "verify" rule (it is mechanical, cleared by \`checklist verify\`)`);
        }
        evidenceRequired = true;
      }
      // Per-item sensor timeout in SECONDS. Only meaningful for a mechanical
      // shell:/script: sensor that runs a real command (a builtin is fast and
      // in-process; a manual check runs nothing). Validated at the parse
      // boundary with the same refuse-to-load posture as everything above: it
      // must be a positive, finite number within a sane ceiling, and it cannot
      // ride on a check that has no `verify` rule (there would be nothing to
      // time — silently ignoring it would hide a config mistake).
      const timeout = check.timeout;
      let timeoutMs: number | undefined;
      if (timeout !== undefined) {
        if (verify === undefined) {
          throw new Error(`Phase "${phase.name}", check "${check.id}": "timeout" applies only to a mechanical check; this check has no "verify" rule`);
        }
        if (typeof timeout !== 'number' || !Number.isFinite(timeout) || timeout <= 0) {
          throw new Error(`Phase "${phase.name}", check "${check.id}": "timeout" must be a positive number of seconds`);
        }
        if (timeout > MAX_TIMEOUT_SECONDS) {
          throw new Error(`Phase "${phase.name}", check "${check.id}": "timeout" of ${timeout}s exceeds the ${MAX_TIMEOUT_SECONDS}s ceiling (a gate sensor must not run unbounded)`);
        }
        timeoutMs = Math.round(timeout * 1000);
      }
      return {
        id: check.id,
        description: check.description,
        verify,
        evidenceRequired,
        timeoutMs,
      };
    });

    const seenIds = new Set<string>();
    for (const ch of checks) {
      if (seenIds.has(ch.id)) {
        throw new Error(`Phase "${phase.name}": duplicate check id "${ch.id}"`);
      }
      seenIds.add(ch.id);
    }

    return { name: phase.name, checks };
  });

  if (phases.length === 0) {
    throw new Error(`${CONFIG_FILE}: "phases" array is empty`);
  }

  // Phases are addressed BY NAME (findPhaseIndex, case-insensitively). Two phases
  // sharing a name would make every non-first one unreachable through its only
  // documented handle, so reject duplicates the same way duplicate check ids are.
  const seenPhaseNames = new Set<string>();
  for (const ph of phases) {
    const key = ph.name.toLowerCase();
    if (seenPhaseNames.has(key)) {
      throw new Error(`${CONFIG_FILE}: duplicate phase name "${ph.name}"`);
    }
    seenPhaseNames.add(key);
  }

  return { phases };
}
