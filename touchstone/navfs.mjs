// navfs.mjs — a tiny IN-MEMORY "tool filesystem" so a review agent must NAVIGATE the
// code (ls / read_file / grep) instead of being force-fed the whole blob in context.
//
// Pure ESM, runs in Node AND the browser, NO real filesystem — just enough tool-surface
// to create the navigation EFFECT, so the identical mechanism runs locally and inside the
// claude.ai artifact (the cross-env consistency constraint holds). We don't simulate a
// real FS (no cwd, perms, paths) — only what navigation needs.
//
// Raw material is free: a fixture's before.txt is already "// ===== <path> =====" sections,
// so we split it back into files and expose three read-only tools over them. Both arms get
// the SAME tools over the SAME files, so navigation ability is equal and the skill stays the
// only manipulated variable.

const SECTION = /^\/\/ ===== (.+?) ===== *$/;

export function makeVirtualFS(beforeText) {
  const src = String(beforeText).split("\n");
  const files = [];
  let cur = null;
  for (const line of src) {
    const m = line.match(SECTION);
    if (m) { cur = { path: m[1].trim(), lines: [] }; files.push(cur); continue; }
    if (!cur) { cur = { path: "code", lines: [] }; files.push(cur); } // no headers → one file
    cur.lines.push(line);
  }
  for (const f of files) while (f.lines.length && f.lines.at(-1).trim() === "") f.lines.pop();

  // tolerant lookup: exact path, else endsWith, else basename, else substring
  const find = (p) => {
    const q = String(p || "").trim();
    return files.find((f) => f.path === q)
        || files.find((f) => f.path.endsWith(q))
        || files.find((f) => f.path.split("/").pop() === q.split("/").pop())
        || files.find((f) => f.path.includes(q));
  };

  function ls() {
    return `${files.length} file(s):\n` + files.map((f) => `  ${f.path}  (${f.lines.length} lines)`).join("\n");
  }

  function read(path, start, end) {
    const f = find(path);
    if (!f) return `no such file: "${path}".\n${ls()}`;
    const s = Math.max(1, start | 0 || 1);
    const e = Math.min(f.lines.length, end | 0 || f.lines.length);
    const w = String(e).length;
    const body = f.lines.slice(s - 1, e).map((ln, i) => `${String(s + i).padStart(w)}  ${ln}`).join("\n");
    const tail = e < f.lines.length
      ? `\n… ${f.lines.length - e} more lines — read_file ${f.path} ${e + 1}-${Math.min(f.lines.length, e + 200)} to continue`
      : "";
    return `${f.path} (lines ${s}-${e} of ${f.lines.length}):\n${body}${tail}`;
  }

  function grep(pattern, path) {
    let re;
    try { re = new RegExp(pattern, "i"); } catch (err) { return `bad regex: ${err.message}`; }
    const scope = path ? files.filter((f) => f.path.includes(path)) : files;
    const hits = [];
    for (const f of scope) f.lines.forEach((ln, i) => { if (re.test(ln)) hits.push(`${f.path}:${i + 1}:${ln.trim().slice(0, 200)}`); });
    if (!hits.length) return `no matches for /${pattern}/${path ? " in " + path : ""}`;
    const CAP = 80;
    return `${hits.length} match(es) for /${pattern}/:\n` + hits.slice(0, CAP).join("\n") +
      (hits.length > CAP ? `\n… ${hits.length - CAP} more — narrow the pattern` : "");
  }

  return { files, ls, read, grep, totalLines: files.reduce((n, f) => n + f.lines.length, 0), manifest: () => ls() };
}

// Marker tools for the harness's text-marker protocol, so a model navigates by emitting:
//   [[ls]]                          list the files under review
//   [[read_file: <path> [a-b]]]     read a file (optionally a line range)
//   [[grep: <pattern> [in <path>]]] search (case-insensitive regex) across files
// Returns the tool's text, or null if `call` isn't a nav tool (so the harness can fall
// through to its other tools).
export function runNavTool(vfs, tool, rest) {
  if (tool === "ls") return vfs.ls();
  if (tool === "read_file") {
    const m = String(rest).trim().match(/^(\S+)(?:\s+(\d+)\s*-\s*(\d+))?/);
    if (!m) return `usage: [[read_file: <path> [start-end]]]`;
    return vfs.read(m[1], m[2] ? +m[2] : undefined, m[3] ? +m[3] : undefined);
  }
  if (tool === "grep") {
    const m = String(rest).trim().match(/^(.*?)(?:\s+in\s+(\S+))?$/);
    return vfs.grep((m && m[1] || rest).trim(), m && m[2]);
  }
  return null;
}

// Parse nav-tool markers out of a model turn. `ls` takes no args (colon optional);
// `read_file`/`grep` take args after the colon. De-duped within a turn (a repeated
// identical marker counts once).
const NAV_MARKER = /\[\[\s*(ls|read_file|grep)\s*:?\s*([\s\S]*?)\]\]/g;
export function parseNavCalls(text) {
  const calls = [], seen = new Set();
  for (const m of String(text).matchAll(NAV_MARKER)) {
    const tool = m[1], rest = m[2].trim();
    const key = `${tool}:${rest}`;
    if (seen.has(key)) continue;
    seen.add(key);
    calls.push({ tool, rest });
  }
  return calls;
}

// Strip nav markers from a turn's text, leaving the model's prose (its findings/review).
export const proseWithoutNav = (text) => String(text).replace(NAV_MARKER, "").trim();
