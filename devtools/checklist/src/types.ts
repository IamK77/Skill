export interface CheckItem {
  id: string;
  description: string;
  verify?: string;
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
