/**
 * Unit tests for PointCloudViewer component
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PointCloudViewer } from '../../../../components/visualizations/PointCloudViewer';
import type { PointCloudData } from '../../../../types/visualization';

describe('PointCloudViewer', () => {
  const mockData: PointCloudData = {
    points: [
      { x: 0, y: 0, z: 0, r: 255, g: 0, b: 0, intensity: 0.8, semantic: 1 },
      { x: 1, y: 1, z: 1, r: 0, g: 255, b: 0, intensity: 0.6, semantic: 2 },
      { x: 2, y: 2, z: 2, r: 0, g: 0, b: 255, intensity: 0.4, semantic: 3 },
    ],
    timestamp: '2024-01-01T00:00:00Z',
    frameId: 'base_link',
  };

  it('renders without crashing', () => {
    const { container } = render(<PointCloudViewer data={mockData} />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('renders with RGB color mode', () => {
    const { container } = render(<PointCloudViewer data={mockData} colorMode="rgb" />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('renders with intensity color mode', () => {
    const { container } = render(<PointCloudViewer data={mockData} colorMode="intensity" />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('renders with semantic color mode', () => {
    const { container } = render(<PointCloudViewer data={mockData} colorMode="semantic" />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('handles empty point cloud', () => {
    const emptyData: PointCloudData = {
      points: [],
      timestamp: '2024-01-01T00:00:00Z',
    };
    const { container } = render(<PointCloudViewer data={emptyData} />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('applies custom point size', () => {
    const { container } = render(<PointCloudViewer data={mockData} pointSize={0.1} />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('optimizes large point clouds', () => {
    // Create a large point cloud
    const largeData: PointCloudData = {
      points: Array.from({ length: 150000 }, (_, i) => ({
        x: i,
        y: i,
        z: i,
        r: 255,
        g: 0,
        b: 0,
      })),
      timestamp: '2024-01-01T00:00:00Z',
    };
    const { container } = render(<PointCloudViewer data={largeData} />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });
});
