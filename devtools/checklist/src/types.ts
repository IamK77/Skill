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
