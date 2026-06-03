import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
import type { ChecklistConfig, Phase, CheckItem } from './types.js';

const CONFIG_FILE = '.checklist.yml';

export function loadChecklist(dir: string): ChecklistConfig {
  const filePath = path.resolve(dir, CONFIG_FILE);

  if (!fs.existsSync(filePath)) {
    throw new Error(`${CONFIG_FILE} not found in ${dir}`);
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

    return { name: phase.name, checks };
  });

  if (phases.length === 0) {
    throw new Error(`${CONFIG_FILE}: "phases" array is empty`);
  }

  return { phases };
}
