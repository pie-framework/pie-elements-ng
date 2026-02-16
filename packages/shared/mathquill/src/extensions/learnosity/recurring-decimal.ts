/**
 * Recurring Decimal Dot (Learnosity)
 *
 * Source: Learnosity/mathquill@master
 * Commit: fea9b27
 * File: src/mathquill.js lines 2891-2910
 *
 * Allows students to enter recurring decimals like 0.3̇ (0.333...)
 * The dot appears above the digit that repeats.
 *
 * Usage: \dot{3} produces 3 with a dot above it
 *
 * NOTE: Desmos fork already has \dot command implemented!
 * See: /tmp/mathquill-migration/desmos/src/commands/math/commands.ts line 220
 *
 * This extension is a no-op since the feature is already available.
 */

import type { MathQuillInterface } from 'mathquill';

export function addRecurringDecimal(_MQ: MathQuillInterface): void {
  // Desmos fork already implements \dot command with proper recurring decimal support
  // The implementation in Desmos uses U_DOT_ABOVE and mq-dot-recurring CSS classes
  // which provides the same functionality as Learnosity's implementation.
  //
  // No additional work needed - this extension exists for documentation purposes.
}
