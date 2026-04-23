export type PieElementFramework = 'react' | 'svelte';

export interface PieDocsSourcePointer {
  file: string;
  exportName?: string;
  path?: string;
}

export interface PieDocsPropertyMetadata {
  title?: string;
  description?: string;
  notes?: string;
  type?: string;
  required?: boolean;
  enum?: Array<string | number | boolean | null>;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  itemType?: string;
  examples?: unknown[];
}

export interface PieDocsViewMetadata {
  pie?: Record<string, PieDocsPropertyMetadata>;
  config?: Record<string, PieDocsPropertyMetadata>;
}

export interface PieDocsViewContract {
  view: string;
  pie: PieDocsSourcePointer;
  config: PieDocsSourcePointer;
  description?: string;
  metadata?: PieDocsViewMetadata;
}

export interface PieDocsContract {
  elementName: string;
  packageName: string;
  framework: PieElementFramework;
  summary?: string;
  supportedModes?: string[];
  views: PieDocsViewContract[];
}

export interface PieDocsProperty {
  path: string;
  type: string;
  required: boolean;
  defaultValue?: unknown;
  title?: string;
  description?: string;
  notes?: string;
  enum?: Array<string | number | boolean | null>;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  itemType?: string;
  examples?: unknown[];
}

export interface PieDocsViewOutput {
  view: string;
  pieProperties: PieDocsProperty[];
  configProperties: PieDocsProperty[];
}

export interface PieDocsElementOutput {
  contract: PieDocsContract;
  packageDir: string;
  generatedAt: string;
  views: PieDocsViewOutput[];
  sourcesUsed: string[];
}

export interface ElementPackageInfo {
  elementName: string;
  packageName: string;
  framework: PieElementFramework;
  packageDir: string;
  packageDescription?: string;
  exportsMap?: Record<string, unknown>;
}
