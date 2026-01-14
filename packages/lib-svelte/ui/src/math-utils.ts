/**
 * Math LaTeX ↔ MathML conversion utilities using MathJax 4
 */

declare global {
  interface Window {
    MathJax?: any;
  }
}

/**
 * Initialize MathJax 4 if not already loaded
 */
async function ensureMathJax(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  // Check if already initialized
  if (window.MathJax?.version) {
    return;
  }

  return new Promise((resolve, reject) => {
    // Configure MathJax before loading
    window.MathJax = {
      tex: {
        packages: ['base', 'ams', 'autoload'],
      },
      startup: {
        ready: () => {
          if (window.MathJax) {
            window.MathJax.startup.defaultReady();
            resolve();
          }
        },
      },
    };

    // Load MathJax from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js';
    script.async = true;
    script.onload = () => {
      setTimeout(resolve, 100);
    };
    script.onerror = () => {
      reject(new Error('Failed to load MathJax'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Convert LaTeX to MathML using MathJax
 */
export async function latexToMathML(latex: string): Promise<string> {
  if (typeof window === 'undefined') {
    return latex;
  }

  try {
    await ensureMathJax();

    if (!window.MathJax?.tex2mml) {
      console.warn('MathJax tex2mml not available, returning LaTeX');
      return latex;
    }

    // Convert LaTeX to MathML
    const mathml = window.MathJax.tex2mml(latex, { display: false });
    return mathml;
  } catch (error) {
    console.error('Error converting LaTeX to MathML:', error);
    return latex;
  }
}

/**
 * Convert MathML to LaTeX (best effort)
 * Note: Full MathML → LaTeX conversion is complex and may not be perfect
 */
export async function mathMLToLatex(mathml: string): Promise<string> {
  if (typeof window === 'undefined') {
    return mathml;
  }

  try {
    // Parse MathML
    const parser = new DOMParser();
    const doc = parser.parseFromString(mathml, 'text/xml');
    const mathElement = doc.querySelector('math');

    if (!mathElement) {
      return mathml;
    }

    // Try to extract LaTeX from annotation if present
    const annotation = mathElement.querySelector('annotation[encoding="application/x-tex"]');
    if (annotation?.textContent) {
      return annotation.textContent;
    }

    // If no annotation, return original
    // Full MathML parsing would require a complex parser
    console.warn('No LaTeX annotation found in MathML, returning original');
    return mathml;
  } catch (error) {
    console.error('Error converting MathML to LaTeX:', error);
    return mathml;
  }
}

/**
 * Convert all LaTeX expressions in HTML to MathML
 */
export async function convertLatexToMathMLInHtml(html: string): Promise<string> {
  if (typeof window === 'undefined') {
    return html;
  }

  // Find all elements with data-latex attribute (KaTeX math nodes)
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const mathElements = doc.querySelectorAll('[data-latex]');

  for (const element of Array.from(mathElements)) {
    const latex = element.getAttribute('data-latex');
    if (latex) {
      try {
        const mathml = await latexToMathML(latex);
        // Replace the element with MathML
        const mathmlElement = parser.parseFromString(mathml, 'text/html').body.firstChild;
        if (mathmlElement) {
          element.replaceWith(mathmlElement);
        }
      } catch (error) {
        console.error('Error converting LaTeX node to MathML:', error);
      }
    }
  }

  return doc.body.innerHTML;
}
