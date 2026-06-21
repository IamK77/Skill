// server-path.test.mjs — the static-file containment guard. The local server serves files
// out of `here`; the guard must let nothing outside it through. Oracle: "a resolved file is
// served iff it lives inside the served root."
import { test } from "node:test";
import assert from "node:assert/strict";
import * as path from "node:path";
import { resolveStaticPath } from "../server.mjs";

const ROOT = "/srv/touchstone";

test("a normal in-tree path resolves to a file under the root", () => {
  assert.equal(resolveStaticPath(ROOT, "/core.mjs"), path.join(ROOT, "core.mjs"));
});

test("'/' maps to the web index", () => {
  assert.equal(resolveStaticPath(ROOT, "/"), path.join(ROOT, "web/index.html"));
});

test("a '..' traversal up and out of the root is rejected", () => {
  assert.equal(resolveStaticPath(ROOT, "/../LICENSE"), null);
});

test("a SIBLING-directory prefix escape is rejected", () => {
  // BUG (pre-fix): startsWith(root) also matches /srv/touchstone-evil, a DIFFERENT directory
  // whose name merely begins with the root — so /../touchstone-evil/secret would be served.
  assert.equal(resolveStaticPath(ROOT, "/../touchstone-evil/secret"), null);
});

test("leading-slash padding cannot smuggle an absolute escape", () => {
  // p.replace(/^\/+/, "") strips leading slashes, so '//etc/passwd' → 'etc/passwd' resolved
  // UNDER the root (harmless), never the absolute /etc/passwd.
  const out = resolveStaticPath(ROOT, "//etc/passwd");
  assert.ok(out === null || out.startsWith(ROOT + path.sep), `must stay under root, got ${out}`);
});
