// checklist.test.mjs — makeChecklist is the deterministic SPINE of the skill arm: it is
// the in-harness reimplementation of the gate machine. If it lets a stage skip ahead, or
// double-counts a verify, the whole "skill ran as a gated workflow" measurement is a lie.
// Oracle: the gate rules documented in harness.mjs (ordered, check-before-verify, a real
// finding ≥40 chars, monotonic progress).
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeChecklist } from "../harness.mjs";

const CONFIG = {
  phases: [
    { name: "charter", checks: [{ id: "motive" }] },
    { name: "survey", checks: [{ id: "surface" }] },
    { name: "triage", checks: [{ id: "ledger" }, { id: "skips" }] },
  ],
};
const finding = (n) => "x".repeat(n); // a "finding" of n chars

test("happy path: check then verify clears a gate and unlocks the next", () => {
  const cl = makeChecklist(CONFIG);
  assert.equal(cl.run("check", ["charter", "motive"], finding(50)).ok, true);
  const v = cl.run("verify", ["charter"]);
  assert.equal(v.ok, true);
  assert.match(v.text, /survey/, "the next stage is named as unlocked");
  assert.deepEqual(cl.clearedGateNames(), ["charter"]);
});

test("verify is BLOCKED until every check in the stage is recorded", () => {
  const cl = makeChecklist(CONFIG);
  cl.run("check", ["charter", "motive"], finding(50));
  cl.run("verify", ["charter"]);
  cl.run("check", ["survey", "surface"], finding(50));
  cl.run("verify", ["survey"]);
  // triage has TWO checks — record only one, verify must fail
  cl.run("check", ["triage", "ledger"], finding(50));
  const blocked = cl.run("verify", ["triage"]);
  assert.equal(blocked.ok, false);
  assert.match(blocked.text, /skips/, "names the missing check");
  assert.ok(!cl.clearedGateNames().includes("triage"));
});

test("a later stage cannot be checked before earlier gates clear (no skip-ahead)", () => {
  const cl = makeChecklist(CONFIG);
  const r = cl.run("check", ["triage", "ledger"], finding(50));
  assert.equal(r.ok, false);
  assert.match(r.text, /earlier gate/i);
});

test("a near-empty finding (<40 chars) is rejected", () => {
  const cl = makeChecklist(CONFIG);
  const r = cl.run("check", ["charter", "motive"], finding(39));
  assert.equal(r.ok, false);
  assert.match(r.text, /actual finding/);
  // and the gate consequently cannot clear
  assert.equal(cl.run("verify", ["charter"]).ok, false);
});

test("unknown stage / unknown check id give actionable errors, not a throw", () => {
  const cl = makeChecklist(CONFIG);
  assert.equal(cl.run("check", ["nope", "x"], finding(50)).ok, false);
  assert.equal(cl.run("check", ["charter", "nope"], finding(50)).ok, false);
});

// ── call-it-again / state-progression probes ────────────────────────────────────
test("verifying the SAME gate twice is idempotent — no double progress", () => {
  const cl = makeChecklist(CONFIG);
  cl.run("check", ["charter", "motive"], finding(50));
  cl.run("verify", ["charter"]);
  const before = cl.clearedGateNames().length;
  const again = cl.run("verify", ["charter"]); // re-invoke the state-advancing op
  assert.equal(cl.clearedGateNames().length, before, "a second verify must not advance the count");
  assert.deepEqual(cl.clearedGateNames(), ["charter"], "still exactly one gate cleared");
  assert.equal(again.ok, true, "re-verifying an already-cleared gate is allowed (idempotent), not an error");
});

test("re-checking an already-passed earlier item does not regress ordering", () => {
  const cl = makeChecklist(CONFIG);
  cl.run("check", ["charter", "motive"], finding(50));
  cl.run("verify", ["charter"]);
  cl.run("check", ["survey", "surface"], finding(50));
  cl.run("verify", ["survey"]);
  // go back and re-check charter's item — must not un-clear survey or reorder anything
  cl.run("check", ["charter", "motive"], finding(60));
  assert.deepEqual(cl.clearedGateNames(), ["charter", "survey"], "earlier re-check leaves cleared gates intact");
});

test("allCleared only after EVERY gate is verified, and never on an empty config", () => {
  const cl = makeChecklist(CONFIG);
  assert.equal(cl.allCleared(), false);
  for (const [phase, ids] of [["charter", ["motive"]], ["survey", ["surface"]], ["triage", ["ledger", "skips"]]]) {
    for (const id of ids) cl.run("check", [phase, id], finding(50));
    cl.run("verify", [phase]);
  }
  assert.equal(cl.allCleared(), true);
  assert.equal(makeChecklist({ phases: [] }).allCleared(), false, "an empty checklist is never 'all cleared'");
});
