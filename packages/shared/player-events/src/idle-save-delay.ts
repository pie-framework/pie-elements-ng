/**
 * The idle-save delay a response editor takes from its player.
 *
 * A host sets the delay once on its player, which answers `sessionCommitContext`
 * for every element inside it (pie-players ADR 0005). The item model carries no
 * delay: how often a response is saved is delivery policy, and one item is
 * delivered by hosts with different save costs. A player that provides nothing,
 * or a field it leaves out, means the element's default.
 */
import { connectContextWithRetry, sessionCommitContext } from '@pie-players/pie-context';

/** How long, in milliseconds, the learner pauses before an editor commits, when the player sets none. */
export const DEFAULT_IDLE_SAVE_DELAY_MS = 1500;

/** A finite, non-negative delay, or the default for anything else; `0` commits on blur only. */
export function resolveIdleSaveDelay(idleSaveDelayMs: unknown): number {
  return typeof idleSaveDelayMs === 'number' &&
    Number.isFinite(idleSaveDelayMs) &&
    idleSaveDelayMs >= 0
    ? idleSaveDelayMs
    : DEFAULT_IDLE_SAVE_DELAY_MS;
}

/**
 * Calls `onDelay` with the delay in effect for `host` whenever its player answers,
 * including a change the host makes later. With no provider it is never called,
 * and the caller keeps `DEFAULT_IDLE_SAVE_DELAY_MS`. Call it from
 * `connectedCallback`, where the request can reach the player; returns the
 * cleanup for `disconnectedCallback`.
 */
export function subscribeIdleSaveDelay(
  host: Element,
  onDelay: (delayMs: number) => void
): () => void {
  return connectContextWithRetry(host, sessionCommitContext, (value) => {
    onDelay(resolveIdleSaveDelay(value?.idleSaveDelayMs));
  });
}
