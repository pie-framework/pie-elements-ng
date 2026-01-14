import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Prompt from './Prompt.svelte';

describe('Prompt', () => {
  it('renders simple HTML content', () => {
    render(Prompt, { html: '<p>What is 2 + 2?</p>' });
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
  });

  it('has role="region" and aria-label', () => {
    const { container } = render(Prompt, { html: '<p>Question</p>' });
    const prompt = container.querySelector('.pie-prompt');
    expect(prompt).toHaveAttribute('role', 'region');
    expect(prompt).toHaveAttribute('aria-label', 'Question prompt');
  });

  it('applies custom className', () => {
    const { container } = render(Prompt, {
      html: '<p>Question</p>',
      className: 'custom-class',
    });
    const prompt = container.querySelector('.pie-prompt');
    expect(prompt).toHaveClass('custom-class');
  });

  it('renders complex HTML with formatting', () => {
    const html = `
      <p>Read the following passage:</p>
      <blockquote>This is a quote.</blockquote>
      <p>Answer the question below:</p>
    `;
    render(Prompt, { html });
    expect(screen.getByText('Read the following passage:')).toBeInTheDocument();
    expect(screen.getByText('This is a quote.')).toBeInTheDocument();
    expect(screen.getByText('Answer the question below:')).toBeInTheDocument();
  });

  it('renders inline code', () => {
    const { container } = render(Prompt, { html: '<p>Use the <code>add()</code> function.</p>' });
    const code = container.querySelector('code');
    expect(code).toBeInTheDocument();
    expect(code).toHaveTextContent('add()');
  });

  it('renders code blocks', () => {
    const { container } = render(Prompt, {
      html: '<pre><code>function add(a, b) { return a + b; }</code></pre>',
    });
    const pre = container.querySelector('pre');
    expect(pre).toBeInTheDocument();
    expect(pre).toHaveTextContent('function add(a, b) { return a + b; }');
  });

  it('renders tables', () => {
    const html = `
      <table>
        <thead>
          <tr><th>Name</th><th>Score</th></tr>
        </thead>
        <tbody>
          <tr><td>Alice</td><td>95</td></tr>
          <tr><td>Bob</td><td>87</td></tr>
        </tbody>
      </table>
    `;
    const { container } = render(Prompt, { html });
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
  });

  it('renders images', () => {
    const { container } = render(Prompt, {
      html: '<img src="/test.jpg" alt="Test image" />',
    });
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test.jpg');
    expect(img).toHaveAttribute('alt', 'Test image');
  });

  it('renders blockquotes', () => {
    const { container } = render(Prompt, {
      html: '<blockquote>Famous quote here</blockquote>',
    });
    const blockquote = container.querySelector('blockquote');
    expect(blockquote).toBeInTheDocument();
    expect(blockquote).toHaveTextContent('Famous quote here');
  });

  it('renders empty HTML', () => {
    const { container } = render(Prompt, { html: '' });
    const prompt = container.querySelector('.pie-prompt');
    expect(prompt).toBeInTheDocument();
    expect(prompt).toBeEmptyDOMElement();
  });

  it('renders nested HTML structure', () => {
    const html = `
      <div>
        <p>Paragraph 1</p>
        <div>
          <p>Nested paragraph</p>
        </div>
      </div>
    `;
    render(Prompt, { html });
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('Nested paragraph')).toBeInTheDocument();
  });
});
