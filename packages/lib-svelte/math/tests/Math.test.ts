import { render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as mathModule from '../src/index';
import MathComponent from '../src/Math.svelte';

// Mock the renderMath function
vi.mock('../src/index', async () => {
  const actual = await vi.importActual<typeof mathModule>('../src/index');
  return {
    ...actual,
    renderMath: vi.fn().mockResolvedValue(undefined),
  };
});

describe('Math', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders HTML content', () => {
    const { container } = render(MathComponent, {
      html: '<p>Simple equation: $x^2$</p>',
    });
    const mathDiv = container.querySelector('.pie-math');
    expect(mathDiv).toBeInTheDocument();
    expect(screen.getByText(/Simple equation:/)).toBeInTheDocument();
  });

  it('applies pie-math class', () => {
    const { container } = render(MathComponent, {
      html: '<p>Test</p>',
    });
    const mathDiv = container.querySelector('.pie-math');
    expect(mathDiv).toHaveClass('pie-math');
  });

  it('calls renderMath on mount', async () => {
    render(MathComponent, {
      html: '<p>$x + y = z$</p>',
    });

    await waitFor(() => {
      expect(mathModule.renderMath).toHaveBeenCalled();
    });
  });

  it('passes useSingleDollar option to renderMath', async () => {
    render(MathComponent, {
      html: '<p>$x$</p>',
      useSingleDollar: true,
    });

    await waitFor(() => {
      expect(mathModule.renderMath).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({ useSingleDollar: true })
      );
    });
  });

  it('defaults useSingleDollar to false', async () => {
    render(MathComponent, {
      html: '<p>$x$</p>',
    });

    await waitFor(() => {
      expect(mathModule.renderMath).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({ useSingleDollar: false })
      );
    });
  });

  it('renders LaTeX expressions', () => {
    const { container } = render(MathComponent, {
      html: '<p>Equation: $\\frac{a}{b}$</p>',
    });
    const mathDiv = container.querySelector('.pie-math');
    expect(mathDiv).toHaveTextContent('Equation:');
    expect(mathDiv?.innerHTML).toContain('\\frac{a}{b}');
  });

  it('renders inline LaTeX', () => {
    const { container } = render(MathComponent, {
      html: 'The value of $x$ is 5',
    });
    const mathDiv = container.querySelector('.pie-math');
    expect(mathDiv?.textContent).toContain('The value of');
    expect(mathDiv?.textContent).toContain('is 5');
  });

  it('renders display LaTeX', () => {
    const { container } = render(MathComponent, {
      html: '<p>Display:</p><p>$$x^2 + y^2 = z^2$$</p>',
    });
    const mathDiv = container.querySelector('.pie-math');
    expect(mathDiv).toHaveTextContent('Display:');
    expect(mathDiv?.innerHTML).toContain('x^2 + y^2 = z^2');
  });

  it('renders complex LaTeX expressions', () => {
    render(MathComponent, {
      html: '$\\sum_{i=1}^{n} i^2 = \\frac{n(n+1)(2n+1)}{6}$',
    });
    expect(screen.getByText(/sum/i)).toBeInTheDocument();
  });

  it('renders MathML', () => {
    const mathML = '<math><mi>x</mi><mo>+</mo><mi>y</mi></math>';
    const { container } = render(MathComponent, {
      html: mathML,
    });
    const math = container.querySelector('math');
    expect(math).toBeInTheDocument();
  });

  it('renders empty HTML', () => {
    const { container } = render(MathComponent, {
      html: '',
    });
    const mathDiv = container.querySelector('.pie-math');
    expect(mathDiv).toBeInTheDocument();
    expect(mathDiv).toBeEmptyDOMElement();
  });

  it('renders HTML with multiple math expressions', () => {
    const { container } = render(MathComponent, {
      html: '<p>$a + b = c$ and $x \\times y = z$</p>',
    });
    const mathDiv = container.querySelector('.pie-math');
    expect(mathDiv?.innerHTML).toContain('a + b = c');
    expect(mathDiv?.innerHTML).toContain('x \\times y = z');
  });

  it('renders complex HTML structure', () => {
    const html = `
      <div>
        <h3>Quadratic Formula</h3>
        <p>The solution is: $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$</p>
      </div>
    `;
    render(MathComponent, { html });
    expect(screen.getByText('Quadratic Formula')).toBeInTheDocument();
    expect(screen.getByText(/The solution is:/)).toBeInTheDocument();
  });

  it('handles special characters in LaTeX', () => {
    const { container } = render(MathComponent, {
      html: '$\\alpha + \\beta = \\gamma$',
    });
    const mathDiv = container.querySelector('.pie-math');
    expect(mathDiv?.innerHTML).toContain('\\alpha');
    expect(mathDiv?.innerHTML).toContain('\\beta');
    expect(mathDiv?.innerHTML).toContain('\\gamma');
  });
});
