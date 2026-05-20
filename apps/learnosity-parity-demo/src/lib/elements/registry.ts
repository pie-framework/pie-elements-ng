/**
 * Learnosity parity element registry.
 *
 * Keep this app scoped to elements that need live Learnosity comparison so the
 * server build does not bundle every demo element and its unrelated assets.
 */

export interface ElementMetadata {
  name: string;
  title: string;
  packageName: string;
  hasAuthor: boolean;
  hasPrint: boolean;
  hasConfig: boolean;
  hasSession: boolean;
  demoCount: number;
}

export const ELEMENT_REGISTRY: readonly ElementMetadata[] = [
  {
    "name": "mc-populated-blank",
    "title": "MC Populated Blank",
    "packageName": "@pie-element/mc-populated-blank",
    "hasAuthor": true,
    "hasPrint": true,
    "hasConfig": true,
    "hasSession": true,
    "demoCount": 8
  }
];

export function getElement(name: string): ElementMetadata | undefined {
  return ELEMENT_REGISTRY.find((el) => el.name === name);
}

export function getAllElements(): readonly ElementMetadata[] {
  return ELEMENT_REGISTRY;
}
