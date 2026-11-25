import {
  PUBLIC_ELEMENT_DEMO_IIFE_BUNDLE_ENDPOINT,
  PUBLIC_ELEMENT_DEMO_IIFE_BUNDLE_HOST,
  PUBLIC_ELEMENT_DEMO_IIFE_BUNDLE_MODE,
  PUBLIC_ELEMENT_DEMO_STATIC,
} from '$app/env/public';

export type PlayerType = 'esm' | 'iife';
export type IifeBundleMode = 'local' | 'hosted';

export const DEFAULT_PLAYER_TYPE: PlayerType = 'esm';
export const isStaticDemo = PUBLIC_ELEMENT_DEMO_STATIC;
export const DEFAULT_LOCAL_IIFE_BUNDLE_ENDPOINT = '/api/bundle';
export const DEFAULT_HOSTED_IIFE_BUNDLE_HOST = 'https://proxy.pie-api.com/bundles/';

export const iifeBundleMode: IifeBundleMode = PUBLIC_ELEMENT_DEMO_IIFE_BUNDLE_MODE;

export const iifeBundleEndpoint =
  iifeBundleMode === 'local'
    ? (PUBLIC_ELEMENT_DEMO_IIFE_BUNDLE_ENDPOINT ?? DEFAULT_LOCAL_IIFE_BUNDLE_ENDPOINT)
    : '';

export const iifeBundleHost =
  iifeBundleMode === 'hosted'
    ? (PUBLIC_ELEMENT_DEMO_IIFE_BUNDLE_HOST ?? DEFAULT_HOSTED_IIFE_BUNDLE_HOST)
    : '';

export const isIifePlayerAvailable = !isStaticDemo || iifeBundleMode === 'hosted';

export function parsePlayerType(value: string | null): PlayerType {
  if (!isIifePlayerAvailable) {
    return DEFAULT_PLAYER_TYPE;
  }

  return value === 'iife' ? 'iife' : 'esm';
}
