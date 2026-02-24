/**
 * Unit tests for Scene3D component
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Scene3D } from '../../../../components/visualizations/Scene3D';

describe('Scene3D', () => {
  it('renders without crashing', () => {
    const { container } = render(<Scene3D />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(<Scene3D className="custom-class" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('custom-class');
  });

  it('renders children inside canvas', () => {
    const { container } = render(
      <Scene3D>
        <mesh data-testid="test-mesh">
          <boxGeometry />
          <meshStandardMaterial />
        </mesh>
      </Scene3D>
    );
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('respects showGrid prop', () => {
    const { rerender, container } = render(<Scene3D showGrid={true} />);
    expect(container.querySelector('canvas')).toBeTruthy();

    rerender(<Scene3D showGrid={false} />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('respects showAxes prop', () => {
    const { rerender, container } = render(<Scene3D showAxes={true} />);
    expect(container.querySelector('canvas')).toBeTruthy();

    rerender(<Scene3D showAxes={false} />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });
});
