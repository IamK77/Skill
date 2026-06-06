import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
import type { ChecklistConfig, Phase, CheckItem } from './types.js';

const CONFIG_FILE = '.checklist.yml';

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
    const phase = p as Record<string, unknown>;
    if (!phase.name || typeof phase.name !== 'string') {
      throw new Error(`Phase ${i}: missing "name" field`);
    }
    if (!Array.isArray(phase.checks)) {
      throw new Error(`Phase "${phase.name}": missing "checks" array`);
    }

    const checks: CheckItem[] = phase.checks.map((c: unknown, j: number) => {
      const check = c as Record<string, unknown>;
      if (!check.id || typeof check.id !== 'string') {
        throw new Error(`Phase "${phase.name}", check ${j}: missing "id"`);
      }
      if (!check.description || typeof check.description !== 'string') {
        throw new Error(`Phase "${phase.name}", check "${check.id}": missing "description"`);
      }
      return {
        id: check.id,
        description: check.description,
        verify: typeof check.verify === 'string' ? check.verify : undefined,
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

  return { phases };
}
