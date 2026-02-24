import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tooltip } from '@/components/help/Tooltip';

describe('Tooltip', () => {
  it('renders children', () => {
    render(
      <Tooltip content="Test tooltip">
        <button>Hover me</button>
      </Tooltip>
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('supports different positions', () => {
    const { rerender } = render(
      <Tooltip content="Test tooltip" position="top">
        <button>Hover me</button>
      </Tooltip>
    );

    // Just verify it renders without error for different positions
    rerender(
      <Tooltip content="Test tooltip" position="bottom">
        <button>Hover me</button>
      </Tooltip>
    );

    rerender(
      <Tooltip content="Test tooltip" position="left">
        <button>Hover me</button>
      </Tooltip>
    );

    rerender(
      <Tooltip content="Test tooltip" position="right">
        <button>Hover me</button>
      </Tooltip>
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('accepts custom delay prop', () => {
    render(
      <Tooltip content="Test tooltip" delay={1000}>
        <button>Hover me</button>
      </Tooltip>
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });
});
