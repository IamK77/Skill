// navfs.test.mjs — the in-memory tool filesystem the review agent navigates. Both arms
// navigate through these tools, so a parsing bug here distorts the navigation the whole
// A/B rests on ("the code is sought, not force-fed"). Oracle: the documented tool contract
// in navfs.mjs ([[grep: <pattern> [in <path>]]], [[read_file: <path> [a-b]]]).
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeVirtualFS, runNavTool, parseNavCalls } from "../navfs.mjs";

const CODE = `// ===== auth/session.js =====
function check(req) {
  // reject the request when the user is not logged in yet
  if (!req || !req.session) return false;
  return req.session.active;
}
// ===== store/release.go =====
func Draft(r *Release) bool {
  return r.IsDraft
}
`;

test("grep finds a multi-word phrase whose middle word is 'in' (not silently mis-scoped)", () => {
  const vfs = makeVirtualFS(CODE);
  const out = runNavTool(vfs, "grep", "logged in yet");
  // BUG (pre-fix): the arg parser splits "logged in yet" into pattern=/logged/ scoped to
  // path "yet"; no path contains "yet" → a misleading "no matches". The agent asked to
  // search a real phrase and silently got the wrong answer.
  assert.doesNotMatch(out, /no matches/i, "the phrase exists in the code — grep must not report no matches");
  assert.match(out, /not logged in yet/, "it should locate the comment line containing the phrase");
});

test("grep STILL honours an explicit 'in <path>' scope when that path is a real file", () => {
  const vfs = makeVirtualFS(CODE);
  const out = runNavTool(vfs, "grep", "func in release.go");
  assert.match(out, /release\.go/, "scoping to release.go works");
  assert.doesNotMatch(out, /session\.js/, "the scope excludes the other file");
});

test("grep without scope searches every file", () => {
  const vfs = makeVirtualFS(CODE);
  const out = runNavTool(vfs, "grep", "return");
  assert.match(out, /session\.js/);
  assert.match(out, /release\.go/);
});

test("grep is a pure read — calling it twice yields the identical result", () => {
  const vfs = makeVirtualFS(CODE);
  const a = runNavTool(vfs, "grep", "active");
  const b = runNavTool(vfs, "grep", "active");
  assert.equal(a, b);
  assert.equal(vfs.files.length, 2, "reads never mutate the file tree");
});

test("makeVirtualFS splits the // ===== header sections into separate files", () => {
  const vfs = makeVirtualFS(CODE);
  assert.deepEqual(vfs.files.map((f) => f.path), ["auth/session.js", "store/release.go"]);
});

test("read_file honours a line range and reports the file's true length", () => {
  const vfs = makeVirtualFS(CODE);
  const out = runNavTool(vfs, "read_file", "session.js 1-2");
  assert.match(out, /lines 1-2 of \d+/);
  assert.match(out, /function check/);
  assert.doesNotMatch(out, /return u/, "line 4 is outside the 1-2 window");
});

test("read_file on a missing path returns a helpful listing, not a throw", () => {
  const vfs = makeVirtualFS(CODE);
  const out = runNavTool(vfs, "read_file", "does-not-exist.ts");
  assert.match(out, /no such file/i);
});

test("parseNavCalls de-dupes repeated identical markers within a turn", () => {
  const calls = parseNavCalls("[[ls]] thinking… [[ls]] then [[grep: foo]]");
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map((c) => c.tool), ["ls", "grep"]);
});
