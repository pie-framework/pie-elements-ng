/**
 * jQuery Global Setup
 * 
 * This module ensures jQuery is available globally before MathQuill loads.
 * MathQuill's UMD bundle expects window.jQuery to exist.
 */

import jQuery from 'jquery';

// Make jQuery available globally for MathQuill UMD bundle
if (typeof window !== 'undefined') {
  (window as any).jQuery = jQuery;
  (window as any).$ = jQuery;
}

export default jQuery;
