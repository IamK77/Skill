#!/usr/bin/env node
try {
  require('../dist/index.js');
} catch (err) {
  // The bin runs the compiled build. If someone runs from a source checkout
  // before building, point them at the fix instead of a raw module-not-found.
  if (err && err.code === 'MODULE_NOT_FOUND' && /dist[/\\]index\.js/.test(err.message)) {
    console.error('checklist: missing build output (dist/). Run "npm run build" in the package directory, or install it with "npm install -g @iamk77/skill-checklist".');
    process.exit(1);
  }
  throw err;
}
