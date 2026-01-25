import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Rationale from '../src/Rationale.svelte';

describe('Rationale', () => {
  it('renders with default title', () => {
    render(Rationale, { rationale: '<p>This is the rationale.</p>' });
    expect(screen.getByText('Rationale')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(Rationale, {
      rationale: '<p>Explanation</p>',
      title: 'Teacher Notes',
    });
    expect(screen.getByText('Teacher Notes')).toBeInTheDocument();
    expect(screen.queryByText('Rationale')).not.toBeInTheDocument();
  });

  it('renders rationale content', () => {
    render(Rationale, {
      rationale: '<p>Students should understand this concept.</p>',
    });
    expect(screen.getByText('Students should understand this concept.')).toBeInTheDocument();
  });

  it('is open by default', () => {
    const { container } = render(Rationale, {
      rationale: '<p>Content</p>',
    });
    const details = container.querySelector('details');
    expect(details).toHaveAttribute('open');
  });

  it('applies custom className', () => {
    const { container } = render(Rationale, {
      rationale: '<p>Content</p>',
      className: 'custom-rationale',
    });
    const rationale = container.querySelector('.pie-rationale');
    expect(rationale).toHaveClass('custom-rationale');
  });

  it('can be collapsed by clicking summary', async () => {
    const user = userEvent.setup();
    const { container } = render(Rationale, {
      rationale: '<p>Content</p>',
    });
    const details = container.querySelector('details');
    const summary = screen.getByText('Rationale');

    expect(details).toHaveAttribute('open');
    await user.click(summary);
    expect(details).not.toHaveAttribute('open');
  });

  it('can be expanded after collapsing', async () => {
    const user = userEvent.setup();
    const { container } = render(Rationale, {
      rationale: '<p>Content</p>',
    });
    const details = container.querySelector('details');
    const summary = screen.getByText('Rationale');

    await user.click(summary);
    expect(details).not.toHaveAttribute('open');

    await user.click(summary);
    expect(details).toHaveAttribute('open');
  });

  it('renders HTML rationale content', () => {
    render(Rationale, {
      rationale: '<p>Point 1</p><p>Point 2 with <strong>emphasis</strong></p>',
    });
    expect(screen.getByText('Point 1')).toBeInTheDocument();
    expect(screen.getByText(/Point 2 with/)).toBeInTheDocument();
    expect(screen.getByText('emphasis')).toBeInTheDocument();
  });

  it('renders complex HTML structure', () => {
    const html = `
      <div>
        <p>Overview:</p>
        <ul>
          <li>Point 1</li>
          <li>Point 2</li>
        </ul>
      </div>
    `;
    render(Rationale, { rationale: html });
    expect(screen.getByText('Overview:')).toBeInTheDocument();
    expect(screen.getByText('Point 1')).toBeInTheDocument();
    expect(screen.getByText('Point 2')).toBeInTheDocument();
  });

  it('has proper summary element', () => {
    const { container } = render(Rationale, {
      rationale: '<p>Content</p>',
    });
    const summary = container.querySelector('summary');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent('Rationale');
  });

  it('has content div with proper class', () => {
    const { container } = render(Rationale, {
      rationale: '<p>Test content</p>',
    });
    const content = container.querySelector('.content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent('Test content');
  });

  it('renders empty rationale', () => {
    const { container } = render(Rationale, { rationale: '' });
    const content = container.querySelector('.content');
    expect(content).toBeInTheDocument();
    expect(content).toBeEmptyDOMElement();
  });
});
