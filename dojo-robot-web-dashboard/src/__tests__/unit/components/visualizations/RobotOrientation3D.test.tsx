/**
 * Unit tests for RobotOrientation3D component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RobotOrientation3D } from '../../../../components/visualizations/RobotOrientation3D';
import type { RobotPose3D, RobotOrientation } from '../../../../types/visualization';

describe('RobotOrientation3D', () => {
  const mockOrientation: RobotOrientation = {
    roll: 0.1,
    pitch: 0.2,
    yaw: 0.3,
  };

  const mockPose: RobotPose3D = {
    position: { x: 1, y: 2, z: 3 },
    orientation: mockOrientation,
    timestamp: '2024-01-01T00:00:00Z',
  };

  it('renders without crashing', () => {
    const { container } = render(<RobotOrientation3D orientation={mockOrientation} />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('displays orientation labels', () => {
    render(<RobotOrientation3D orientation={mockOrientation} />);
    expect(screen.getByText('Orientation')).toBeTruthy();
    expect(screen.getByText(/Roll:/)).toBeTruthy();
    expect(screen.getByText(/Pitch:/)).toBeTruthy();
    expect(screen.getByText(/Yaw:/)).toBeTruthy();
  });

  it('converts radians to degrees in labels', () => {
    render(<RobotOrientation3D orientation={mockOrientation} />);
    // 0.1 rad ≈ 5.7°, 0.2 rad ≈ 11.5°, 0.3 rad ≈ 17.2°
    expect(screen.getByText(/5\.7°/)).toBeTruthy();
    expect(screen.getByText(/11\.5°/)).toBeTruthy();
    expect(screen.getByText(/17\.2°/)).toBeTruthy();
  });

  it('renders with full pose data', () => {
    const { container } = render(<RobotOrientation3D pose={mockPose} />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('uses orientation from pose when both provided', () => {
    const directOrientation: RobotOrientation = {
      roll: 0.5,
      pitch: 0.6,
      yaw: 0.7,
    };
    render(<RobotOrientation3D pose={mockPose} orientation={directOrientation} />);
    // Should use pose orientation (0.1, 0.2, 0.3), not direct orientation
    expect(screen.getByText(/5\.7°/)).toBeTruthy();
  });

  it('handles zero orientation', () => {
    const zeroOrientation: RobotOrientation = {
      roll: 0,
      pitch: 0,
      yaw: 0,
    };
    render(<RobotOrientation3D orientation={zeroOrientation} />);
    const zeroValues = screen.getAllByText(/0\.0°/);
    expect(zeroValues).toHaveLength(3); // Roll, Pitch, Yaw all 0.0°
  });

  it('respects custom axis length', () => {
    const { container } = render(
      <RobotOrientation3D orientation={mockOrientation} axisLength={5} />
    );
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('respects animate prop', () => {
    const { container } = render(
      <RobotOrientation3D orientation={mockOrientation} animate={false} />
    );
    expect(container.querySelector('canvas')).toBeTruthy();
  });
});
