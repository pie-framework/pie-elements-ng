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

export function extractDependencies(content: string): string[] {
  const deps = new Set<string>();

  // Match import statements
  const importRegex = /import\s+.+\s+from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null = importRegex.exec(content);

  while (match !== null) {
    const dep = match[1];
    // Skip relative imports
    if (!dep.startsWith('.') && !dep.startsWith('/')) {
      // Extract package name (handle scoped packages)
      const pkgName = dep.startsWith('@')
        ? dep.split('/').slice(0, 2).join('/')
        : dep.split('/')[0];
      deps.add(pkgName);
    }
    match = importRegex.exec(content);
  }

  return Array.from(deps).sort();
}
