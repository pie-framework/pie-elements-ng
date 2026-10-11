export type PieElementFramework = 'react' | 'svelte';

export interface PieDocsSourcePointer {
  file: string;
  exportName?: string;
  path?: string;
}

export interface PieDocsViewContract {
  view: string;
  pie: PieDocsSourcePointer;
  config: PieDocsSourcePointer;
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
  description?: string;
  enum?: Array<string | number | boolean | null>;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  itemType?: string;
}

/** A named object type a schema references, documented once. */
export interface PieDocsDefinition {
  name: string;
  description?: string;
  properties: PieDocsProperty[];
}

export interface PieDocsSchemaDocs {
  properties: PieDocsProperty[];
  definitions: PieDocsDefinition[];
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
