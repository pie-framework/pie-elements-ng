/**
 * Choice Persistence Utilities
 *
 * Functions for managing shuffled choice order and session persistence.
 */

interface Session {
  id?: string;
  element?: string;
  data?: {
    shuffledValues?: string[];
  };
  shuffledValues?: string[];
}

interface Choice {
  [key: string]: any;
}

interface Model {
  lockChoiceOrder?: boolean;
}

interface Environment {
  '@pie-element'?: {
    lockChoiceOrder?: boolean;
  };
  role?: 'student' | 'instructor';
}

type UpdateSessionFunction = (
  sessionId: string,
  element: string,
  data: { shuffledValues: string[] }
) => Promise<void>;

/**
 * Remove null and undefined values from an array.
 */
function compact<T>(arr: T[] | undefined | null): T[] {
  if (Array.isArray(arr)) {
    return arr.filter((v): v is T => v !== null && v !== undefined);
  }
  return [];
}

/**
 * Fisher-Yates shuffle algorithm for randomizing array order.
 */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Check if an object or array is empty.
 */
function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Get shuffled choices, either from session storage or by creating a new shuffle.
 *
 * This function:
 * 1. Checks if shuffled values already exist in the session
 * 2. If they exist, returns choices in that order
 * 3. If they don't exist, shuffles the choices and optionally saves to session
 *
 * @param choices - Array of choice objects to shuffle
 * @param session - Current session object that may contain previous shuffle order
 * @param updateSession - Optional function to persist the shuffle order
 * @param choiceKey - Property name to use as the unique identifier (e.g., 'value', 'id')
 * @returns Promise resolving to shuffled choices array
 */
export async function getShuffledChoices<T extends Choice>(
  choices: T[],
  session: Session | undefined,
  updateSession?: UpdateSessionFunction,
  choiceKey: string = 'value'
): Promise<T[] | undefined> {
  const currentShuffled = compact(
    session?.data?.shuffledValues ?? session?.shuffledValues ?? []
  );

  if (!session) {
    console.warn("Unable to save shuffled choices because there's no session.");
    return undefined;
  }

  if (!isEmpty(currentShuffled)) {
    // Use existing shuffled order from session
    return compact(
      currentShuffled.map((v) => choices.find((c) => c[choiceKey] === v))
    ) as T[];
  }

  // Create new shuffle
  const shuffledChoices = shuffle(choices);

  if (updateSession && typeof updateSession === 'function') {
    try {
      const shuffledValues = compact(
        shuffledChoices.map((c) => c[choiceKey])
      ) as string[];

      if (isEmpty(shuffledValues)) {
        console.error(
          `shuffledValues is an empty array - refusing to call updateSession. ` +
            `shuffledChoices: ${JSON.stringify(shuffledChoices)}, key: ${choiceKey}`
        );
      } else if (session.id && session.element) {
        await updateSession(session.id, session.element, { shuffledValues });
      }
    } catch (e) {
      console.warn('Unable to save shuffled order for choices');
      console.error(e);
    }
  } else {
    console.warn('Unable to save shuffled choices, shuffle will happen every time.');
  }

  return shuffledChoices;
}

/**
 * Determine whether choice order should be locked (ordinal) or shuffled.
 *
 * Returns:
 * - `true` - Choices maintain their ordinal order (as created in configure)
 * - `false` - Choices will be shuffled (via getShuffledChoices)
 *
 * Logic:
 * 1. If model.lockChoiceOrder is true, lock order
 * 2. If env['@pie-element'].lockChoiceOrder is true, lock order
 * 3. If role is 'instructor', lock order (instructors see ordinal order)
 * 4. Otherwise (student role), allow shuffling
 *
 * @param model - Model configuration
 * @param session - Current session (unused currently but kept for API compatibility)
 * @param env - Environment configuration
 * @returns Whether to lock choice order
 */
export function lockChoices(
  model: Model,
  _session: Session | undefined,
  env: Environment
): boolean {
  if (model.lockChoiceOrder) {
    return true;
  }

  if (env['@pie-element']?.lockChoiceOrder) {
    return true;
  }

  const role = env.role ?? 'student';

  if (role === 'instructor') {
    // Instructors always see ordinal order
    // In the future, they may be able to toggle between ordinal and shuffled
    return true;
  }

  // Students get shuffled order (unless locked above)
  return false;
}
