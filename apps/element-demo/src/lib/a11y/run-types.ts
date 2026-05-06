export type A11yRunScope = 'full-scenarios' | 'element-scenarios' | 'single-scenario' | 'inventory';

export type A11yRunStatus = 'queued' | 'running' | 'passed' | 'findings' | 'failed';

export interface A11yRunRequest {
  scope: A11yRunScope;
  element?: string;
  scenario?: string;
}

export interface A11yReportLink {
  label: string;
  href: string;
}

export interface A11yRunJobSnapshot {
  id: string;
  scope: A11yRunScope;
  status: A11yRunStatus;
  command: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  exitCode?: number;
  element?: string;
  scenario?: string;
  outputTail: string;
  reportLinks: A11yReportLink[];
}
