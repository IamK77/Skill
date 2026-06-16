// Self-carry build: bundle the whole CLI — including its only three runtime
// deps (commander, gray-matter, js-yaml) — into a single, node-runnable file
// committed into the repo at bundle/checklist.mjs.
//
// Why this exists (spec output/90-repo-audit.md §八-4): a skill's opener runs
// `checklist init ...`, which today needs a global npm install on PATH. That
// install-or-fail-open problem (§七) dissolves if the gate ships *with* the
// plugin. Because the runtime deps are tiny and pure, the whole gate fits in
// one file; installing the plugin then means the gate is already present, and
// its version is pinned to the marketplace rather than to whatever happens to
// be on PATH.
//
// Reproducibility: no timestamps or absolute paths leak into the artifact.
// esbuild output is deterministic for a fixed input + version, so re-running
// `npm run bundle` on the same source produces byte-identical output. The
// version is injected via --define so the single file needs no package.json
// beside it at runtime (see the BUNDLED_VERSION note in src/index.ts).

import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, '..');

const { version } = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'));

const outfile = join(pkgRoot, 'bundle', 'checklist.mjs');

await build({
  entryPoints: [join(pkgRoot, 'src', 'index.ts')],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  // Inline all three runtime deps; nothing stays external. The bundle must run
  // with no node_modules present.
  packages: 'bundle',
  // The version read in src/index.ts falls back to a package.json read when this
  // is absent (the dist/ build); here we pin it so the single file is self-contained.
  define: { __CHECKLIST_BUNDLED_VERSION__: JSON.stringify(version) },
  legalComments: 'none',
  // ESM needs a shim for the CommonJS-style __dirname/require some deps use.
  banner: {
    js: [
      "import { createRequire as __checklistCreateRequire } from 'node:module';",
      "import { fileURLToPath as __checklistFileURLToPath } from 'node:url';",
      "import { dirname as __checklistDirname } from 'node:path';",
      'const require = __checklistCreateRequire(import.meta.url);',
      'const __filename = __checklistFileURLToPath(import.meta.url);',
      'const __dirname = __checklistDirname(__filename);',
    ].join('\n'),
  },
});

const bytes = readFileSync(outfile).length;
console.log(`bundled checklist v${version} -> ${outfile} (${bytes} bytes)`);
