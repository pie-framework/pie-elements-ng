/**
 * Partial Scoring Utilities
 *
 * Determines whether partial scoring should be enabled based on model and environment configuration.
 */

interface Config {
  partialScoring?: boolean;
}

interface Environment {
  partialScoring?: boolean;
}

/**
 * Check if partial scoring is enabled based on config and environment settings.
 *
 * Rules:
 * - If model.partialScoring = false, always use dichotomous scoring (return false)
 * - If env.partialScoring = false, always use dichotomous scoring (return false)
 * - Otherwise, use partial scoring (return true or defaultValue)
 *
 * @param config - Model configuration
 * @param env - Environment configuration
 * @param defaultValue - Default value if neither config nor env specify a preference
 * @returns Whether partial scoring is enabled
 */
export function enabled(
  config?: Config,
  env?: Environment,
  defaultValue?: boolean
): boolean {
  if (config?.partialScoring === false) {
    return false;
  }

  if (env?.partialScoring === false) {
    return false;
  }

  return typeof defaultValue === 'boolean' ? defaultValue : true;
}
