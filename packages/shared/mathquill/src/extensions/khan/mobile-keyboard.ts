/**
 * Mobile Keyboard Support (Khan Academy)
 *
 * Source: Khan/mathquill@v1.0.3
 * PR: https://github.com/Khan/mathquill/pull/16
 * File: src/publicapi.ts
 *
 * Fixes Android keyboard input issues where certain keys
 * weren't being recognized properly, particularly with
 * Samsung keyboards and other Android IMEs.
 *
 * NOTE: Desmos fork is BASED on Khan's fork, so these fixes
 * are already included in the Desmos codebase.
 */

export function applyMobileKeyboardFixes(_MQ: any): void {
  // Khan Academy's mobile keyboard fixes are built into the Desmos/Khan fork.
  // The key improvements from Khan's PR #16:
  // 1. Better Android IME composition event handling
  // 2. Improved touch event handling on mobile
  // 3. Virtual keyboard behavior fixes
  //
  // Since Desmos fork includes these changes, no additional work needed.
  // This function exists for documentation and extension loader consistency.
}
