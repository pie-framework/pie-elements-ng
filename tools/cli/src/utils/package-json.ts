import { readFile, writeFile } from 'node:fs/promises';

export interface PackageJson {
  name: string;
  version: string;
  private?: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export async function loadPackageJson(path: string): Promise<PackageJson> {
  const content = await readFile(path, 'utf-8');
  return JSON.parse(content) as PackageJson;
}

export async function writePackageJson(path: string, pkg: PackageJson): Promise<void> {
  const content = `${JSON.stringify(pkg, null, 2)}\n`;
  await writeFile(path, content, 'utf-8');
}
