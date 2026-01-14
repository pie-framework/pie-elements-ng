import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import LoadingSpinner from './LoadingSpinner.svelte';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    const { container } = render(LoadingSpinner);
    const loading = container.querySelector('.pie-loading');
    expect(loading).toBeInTheDocument();
    expect(loading).toHaveAttribute('role', 'status');
    expect(loading).toHaveAttribute('aria-live', 'polite');
  });

  it('renders spinner SVG', () => {
    const { container } = render(LoadingSpinner);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('spinner');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows default "Loading..." text for screen readers', () => {
    render(LoadingSpinner);
    const srText = screen.getByText('Loading...');
    expect(srText).toBeInTheDocument();
    expect(srText).toHaveClass('sr-only');
  });

  it('renders custom message when provided', () => {
    render(LoadingSpinner, { message: 'Please wait...' });
    const messages = screen.getAllByText('Please wait...');
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]).toBeInTheDocument();
  });

  it('shows custom message for screen readers', () => {
    render(LoadingSpinner, { message: 'Loading data...' });
    const srText = screen.getAllByText('Loading data...')[0];
    expect(srText).toHaveClass('sr-only');
  });

  it('displays custom message visually', () => {
    const { container } = render(LoadingSpinner, { message: 'Loading content...' });
    const message = container.querySelector('.message');
    expect(message).toBeInTheDocument();
    expect(message).toHaveTextContent('Loading content...');
  });

  it('applies small size class', () => {
    const { container } = render(LoadingSpinner, { size: 'sm' });
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-4');
    expect(svg).toHaveClass('h-4');
  });

  it('applies medium size class by default', () => {
    const { container } = render(LoadingSpinner);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-8');
    expect(svg).toHaveClass('h-8');
  });

  it('applies medium size class explicitly', () => {
    const { container } = render(LoadingSpinner, { size: 'md' });
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-8');
    expect(svg).toHaveClass('h-8');
  });

  it('applies large size class', () => {
    const { container } = render(LoadingSpinner, { size: 'lg' });
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-12');
    expect(svg).toHaveClass('h-12');
  });

  it('applies custom className', () => {
    const { container } = render(LoadingSpinner, { className: 'custom-loading' });
    const loading = container.querySelector('.pie-loading');
    expect(loading).toHaveClass('custom-loading');
  });

  it('has accessible role and aria attributes', () => {
    const { container } = render(LoadingSpinner);
    const loading = container.querySelector('.pie-loading');
    expect(loading).toHaveAttribute('role', 'status');
    expect(loading).toHaveAttribute('aria-live', 'polite');
  });

  it('has spinner with proper SVG structure', () => {
    const { container } = render(LoadingSpinner);
    const svg = container.querySelector('svg');
    const circle = svg?.querySelector('circle');
    const path = svg?.querySelector('path');
    expect(circle).toBeInTheDocument();
    expect(path).toBeInTheDocument();
  });

  it('does not show message paragraph when no message provided', () => {
    const { container } = render(LoadingSpinner);
    const message = container.querySelector('.message');
    expect(message).not.toBeInTheDocument();
  });

  it('shows both sr-only and visible message when message provided', () => {
    render(LoadingSpinner, { message: 'Test message' });
    const srText = screen.getAllByText('Test message');
    expect(srText).toHaveLength(2); // One for sr-only, one for visible message
  });

  it('combines custom className with pie-loading', () => {
    const { container } = render(LoadingSpinner, {
      className: 'my-custom-class another-class',
    });
    const loading = container.querySelector('.pie-loading');
    expect(loading).toHaveClass('pie-loading');
    expect(loading).toHaveClass('my-custom-class');
    expect(loading).toHaveClass('another-class');
  });

  it('renders with all props combined', () => {
    const { container } = render(LoadingSpinner, {
      message: 'Loading your data...',
      size: 'lg',
      className: 'custom-spinner',
    });

    const loading = container.querySelector('.pie-loading');
    const svg = container.querySelector('svg');
    const message = container.querySelector('.message');

    expect(loading).toHaveClass('custom-spinner');
    expect(svg).toHaveClass('w-12', 'h-12');
    expect(message).toHaveTextContent('Loading your data...');
  });
});
