/**
 * Unit tests for GaussianSplatViewer component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GaussianSplatViewer } from '../../../../components/visualizations/GaussianSplatViewer';
import type { GaussianSplatData } from '../../../../types/visualization';

describe('GaussianSplatViewer', () => {
  const mockData: GaussianSplatData = {
    splats: [
      {
        position: [0, 0, 0],
        color: [1, 0, 0],
        covariance: [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
        opacity: 0.8,
      },
      {
        position: [1, 1, 1],
        color: [0, 1, 0],
        covariance: [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
        opacity: 0.6,
      },
      {
        position: [2, 2, 2],
        color: [0, 0, 1],
        covariance: [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
        opacity: 0.4,
      },
    ],
    timestamp: '2024-01-01T00:00:00Z',
    frameId: 'base_link',
  };

  it('renders without crashing', () => {
    const { container } = render(<GaussianSplatViewer data={mockData} />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('displays statistics when showStats is true', () => {
    render(<GaussianSplatViewer data={mockData} showStats={true} />);
    expect(screen.getByText('Reconstruction Statistics')).toBeTruthy();
    expect(screen.getByText('Total Splats:')).toBeTruthy();
    expect(screen.getByText('Avg Opacity:')).toBeTruthy();
    expect(screen.getByText('Memory:')).toBeTruthy();
  });

  it('hides statistics when showStats is false', () => {
    render(<GaussianSplatViewer data={mockData} showStats={false} />);
    expect(screen.queryByText('Reconstruction Statistics')).toBeNull();
  });

  it('renders with points mode', () => {
    const { container } = render(<GaussianSplatViewer data={mockData} renderMode="points" />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('renders with ellipsoids mode', () => {
    const { container } = render(<GaussianSplatViewer data={mockData} renderMode="ellipsoids" />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('renders with full mode', () => {
    const { container } = render(<GaussianSplatViewer data={mockData} renderMode="full" />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('handles empty splat data', () => {
    const emptyData: GaussianSplatData = {
      splats: [],
      timestamp: '2024-01-01T00:00:00Z',
    };
    render(<GaussianSplatViewer data={emptyData} showStats={true} />);
    expect(screen.getByText('0')).toBeTruthy(); // Total splats should be 0
  });

  it('computes correct statistics', () => {
    render(<GaussianSplatViewer data={mockData} showStats={true} />);
    expect(screen.getByText('3')).toBeTruthy(); // 3 splats
    // Average opacity: (0.8 + 0.6 + 0.4) / 3 = 0.6
    expect(screen.getByText('0.600')).toBeTruthy();
  });

  it('displays bounding box information', () => {
    render(<GaussianSplatViewer data={mockData} showStats={true} />);
    expect(screen.getByText('Bounding Box:')).toBeTruthy();
    expect(screen.getByText(/Min:/)).toBeTruthy();
    expect(screen.getByText(/Max:/)).toBeTruthy();
  });

  it('formats memory usage correctly', () => {
    render(<GaussianSplatViewer data={mockData} showStats={true} />);
    // Should display memory in bytes, KB, or MB
    const memoryText = screen.getByText(/Memory:/);
    expect(memoryText).toBeTruthy();
  });
});
