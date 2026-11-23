/** The IIFE global for a package: `@pie-element/mc-populated-blank` -> `McPopulatedBlankElement`. */
export function iifeGlobalName(packageName: string): string {
  return `${packageName
    .replace(/^@[^/]+\//, '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join('')}Element`;
}
