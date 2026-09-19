// Self-carry build: bundle the whole CLI — including its only three runtime
// deps (commander, gray-matter, js-yaml) — into a single, node-runnable file
// committed into the repo at bundle/checklist.mjs.
//
// A standalone local CLI without a global installation or node_modules.
// It records SOP runs; loading a skill does not execute or reset a run.
// --check builds in memory and fails if the committed artifact is stale.
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

const check = process.argv.includes('--check');
const result = await build({
  write: !check,
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

if (check) {
  const expected = result.outputFiles[0].contents;
  const current = readFileSync(outfile);
  if (!current.equals(Buffer.from(expected))) {
    console.error('STALE bundle: run npm run bundle, then review and commit the generated artifact.');
    process.exitCode = 1;
  } else console.log('bundle matches source byte-for-byte');
} else {
  console.log(`bundled checklist v${version} -> ${outfile} (${readFileSync(outfile).length} bytes)`);
}
