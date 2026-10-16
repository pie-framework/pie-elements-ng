/**
 * The TeX packages MathJax's `tex-mml-chtml.js` component makes available, registered by import.
 * The bundled engine and `texToMathml` both typeset with them; the page engine loads its own.
 */
// The TeX packages `input/tex` preloads, less require and autoload, which load packages through
// the component loader.
import '@mathjax/src/js/input/tex/base/BaseConfiguration.js';
import '@mathjax/src/js/input/tex/ams/AmsConfiguration.js';
import '@mathjax/src/js/input/tex/newcommand/NewcommandConfiguration.js';
import '@mathjax/src/js/input/tex/textmacros/TextMacrosConfiguration.js';
import '@mathjax/src/js/input/tex/noundefined/NoUndefinedConfiguration.js';
import '@mathjax/src/js/input/tex/configmacros/ConfigMacrosConfiguration.js';
// The packages autoload loads on the first use of one of their macros.
import '@mathjax/src/js/input/tex/action/ActionConfiguration.js';
import '@mathjax/src/js/input/tex/amscd/AmsCdConfiguration.js';
import '@mathjax/src/js/input/tex/bbox/BboxConfiguration.js';
import '@mathjax/src/js/input/tex/boldsymbol/BoldsymbolConfiguration.js';
import '@mathjax/src/js/input/tex/braket/BraketConfiguration.js';
import '@mathjax/src/js/input/tex/bussproofs/BussproofsConfiguration.js';
import '@mathjax/src/js/input/tex/cancel/CancelConfiguration.js';
import '@mathjax/src/js/input/tex/color/ColorConfiguration.js';
import '@mathjax/src/js/input/tex/enclose/EncloseConfiguration.js';
import '@mathjax/src/js/input/tex/extpfeil/ExtpfeilConfiguration.js';
import '@mathjax/src/js/input/tex/html/HtmlConfiguration.js';
import '@mathjax/src/js/input/tex/mhchem/MhchemConfiguration.js';
import '@mathjax/src/js/input/tex/unicode/UnicodeConfiguration.js';
import '@mathjax/src/js/input/tex/verb/VerbConfiguration.js';

export const TEX_PACKAGES: string[] = [
  'base',
  'ams',
  'newcommand',
  'textmacros',
  'noundefined',
  'configmacros',
  'action',
  'amscd',
  'bbox',
  'boldsymbol',
  'braket',
  'bussproofs',
  'cancel',
  'color',
  'enclose',
  'extpfeil',
  'html',
  'mhchem',
  'unicode',
  'verb',
];
