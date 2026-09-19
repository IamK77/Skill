import type { ChecklistConfig } from './types.js';

// A var name must be a shell-identifier — the same shape interpolate() will match
// in a `${name}` placeholder. Reject anything else loudly at init so a typo can
// never quietly capture a var that no rule can ever reference.
const VAR_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

// Parse the repeated `--var name=value` flags into a vars map. Each entry must
// be `name=value` with a valid name; the value may be empty or contain further
// `=` (only the first splits). Throws a located error on a malformed entry or a
// duplicate name rather than silently dropping or last-wins overwriting it.
export function parseVars(raw: string[]): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const entry of raw) {
    const eq = entry.indexOf('=');
    if (eq === -1) {
      throw new Error(`invalid --var "${entry}": expected name=value`);
    }
    const name = entry.slice(0, eq);
    const value = entry.slice(eq + 1);
    if (!VAR_NAME.test(name)) {
      throw new Error(`invalid --var name "${name}": must match [A-Za-z_][A-Za-z0-9_]* (from "${entry}")`);
    }
    if (Object.prototype.hasOwnProperty.call(vars, name)) {
      throw new Error(`duplicate --var name "${name}"`);
    }
    Object.defineProperty(vars, name, { value, enumerable: true, writable: true, configurable: true });
  }
  return vars;
}

export function requiredVars(template: string): string[] {
  return [...template.replace(/\$\$/g, '').matchAll(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map(m => m[1]);
}
export function captureVars(config: ChecklistConfig, explicit: Record<string, string>): Record<string, string> {
  const vars = { ...explicit };
  for (const phase of config.phases) for (const item of phase.checks) {
    for (const name of requiredVars(item.verify || '')) {
      if (!Object.hasOwn(vars, name) && Object.hasOwn(process.env, name)) Object.defineProperty(vars, name, { value: process.env[name]!, enumerable: true, writable: true, configurable: true });
    }
  }
  return vars;
}
