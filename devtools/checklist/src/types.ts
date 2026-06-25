export interface CheckItem {
  id: string;
  description: string;
  verify?: string;
  // Per-item opt-in: when true, a manual `check` MUST be accompanied by an
  // `--evidence` string. Set by the loader from `evidence: required` in the
  // .checklist.yml. It forces the agent to cite something specific (a
  // file:line, a command-output snippet, an artifact path) rather than a bare
  // "confirmed" — it does NOT verify the evidence is real, only that one exists.
  evidenceRequired?: boolean;
  // Per-item override for how long a mechanical (shell:/script:) sensor may run,
  // in milliseconds. Set by the loader from `timeout: <seconds>` in the
  // .checklist.yml. Absent means the runner's default (10s). It exists because a
  // real independent-verification sensor — running a project's actual test
  // suite, build, or scan — routinely needs minutes, far past the 10s default
  // tuned for the fast in-process builtins. Ignored by builtin/manual checks.
  timeoutMs?: number;
}

export interface Phase {
  name: string;
  checks: CheckItem[];
}

export interface ChecklistConfig {
  phases: Phase[];
}

export interface CheckResult {
  status: 'pass' | 'fail' | 'error';
  message: string;
  // The specificity string supplied at `check --evidence` time (a file:line, a
  // command-output snippet, an artifact path). Persisted in the state record so
  // `show`/`report` can surface WHAT a manual confirmation was based on. Always
  // absent for mechanical (verify-rule) results — those carry the runner's own
  // output in `message`.
  evidence?: string;
}

export interface CheckItemResult {
  item: CheckItem;
  kind: 'mechanical' | 'manual';
  result?: CheckResult;
}

export interface PhaseResult {
  phaseName: string;
  phaseIndex: number;
  checks: CheckItemResult[];
  mechanicalPassed: number;
  mechanicalTotal: number;
  manualCount: number;
}

export type BuiltinHandler = (targetPath: string) => Promise<CheckResult>;
