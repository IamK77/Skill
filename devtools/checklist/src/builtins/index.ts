import type { BuiltinHandler } from '../types.js';
import { frontmatterCheck } from './frontmatter.js';
import { nameFormatCheck } from './name-format.js';
import { descriptionPresentCheck, descriptionLengthCheck } from './description.js';
import { noSecretsCheck } from './no-secrets.js';
import { fileRefsCheck } from './file-refs.js';
import { hasChecklistCheck } from './has-checklist.js';
import { lineCountCheck } from './line-count.js';

const BUILTINS: Record<string, BuiltinHandler> = {
  'frontmatter': frontmatterCheck,
  'name-format': nameFormatCheck,
  'description-present': descriptionPresentCheck,
  'description-length': descriptionLengthCheck,
  'no-secrets': noSecretsCheck,
  'file-refs': fileRefsCheck,
  'has-checklist': hasChecklistCheck,
  'line-count': lineCountCheck,
};

export function getBuiltin(name: string): BuiltinHandler | undefined {
  return BUILTINS[name];
}

export function listBuiltins(): string[] {
  return Object.keys(BUILTINS);
}
