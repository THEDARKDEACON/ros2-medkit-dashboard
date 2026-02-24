/**
 * Unit tests for Visualization3DControls component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Visualization3DControls,
  exportVisualizationData,
} from '../../../../components/visualizations/Visualization3DControls';

describe('Visualization3DControls', () => {
  it('renders in collapsed state by default', () => {
    render(<Visualization3DControls />);
    expect(screen.getByTitle('Show controls')).toBeTruthy();
  });

  it('expands when clicked', () => {
    render(<Visualization3DControls />);
    const expandButton = screen.getByTitle('Show controls');
    fireEvent.click(expandButton);
    expect(screen.getByText('Visualization Controls')).toBeTruthy();
  });

  it('collapses when hide button is clicked', () => {
    render(<Visualization3DControls />);
    const expandButton = screen.getByTitle('Show controls');
    fireEvent.click(expandButton);
    const hideButton = screen.getByTitle('Hide controls');
    fireEvent.click(hideButton);
    expect(screen.queryByText('Visualization Controls')).toBeNull();
  });

  it('displays color mode controls for point clouds', () => {
    const onColorModeChange = vi.fn();
    render(<Visualization3DControls colorMode="rgb" onColorModeChange={onColorModeChange} />);
    fireEvent.click(screen.getByTitle('Show controls'));
    expect(screen.getByText('Color Mode')).toBeTruthy();
    expect(screen.getByText('RGB')).toBeTruthy();
    expect(screen.getByText('Intensity')).toBeTruthy();
    expect(screen.getByText('Semantic')).toBeTruthy();
  });

  it('calls onColorModeChange when color mode is changed', () => {
    const onColorModeChange = vi.fn();
    render(<Visualization3DControls colorMode="rgb" onColorModeChange={onColorModeChange} />);
    fireEvent.click(screen.getByTitle('Show controls'));
    fireEvent.click(screen.getByText('Intensity'));
    expect(onColorModeChange).toHaveBeenCalledWith('intensity');
  });

  it('displays render mode controls for Gaussian splats', () => {
    const onRenderModeChange = vi.fn();
    render(
      <Visualization3DControls renderMode="full" onRenderModeChange={onRenderModeChange} />
    );
    fireEvent.click(screen.getByTitle('Show controls'));
    expect(screen.getByText('Render Mode')).toBeTruthy();
    expect(screen.getByText('Points')).toBeTruthy();
    expect(screen.getByText('Ellipsoids')).toBeTruthy();
    expect(screen.getByText('Full')).toBeTruthy();
  });

  it('calls onRenderModeChange when render mode is changed', () => {
    const onRenderModeChange = vi.fn();
    render(
      <Visualization3DControls renderMode="full" onRenderModeChange={onRenderModeChange} />
    );
    fireEvent.click(screen.getByTitle('Show controls'));
    fireEvent.click(screen.getByText('Points'));
    expect(onRenderModeChange).toHaveBeenCalledWith('points');
  });

  it('displays point size slider', () => {
    const onPointSizeChange = vi.fn();
    render(<Visualization3DControls pointSize={0.05} onPointSizeChange={onPointSizeChange} />);
    fireEvent.click(screen.getByTitle('Show controls'));
    expect(screen.getByText(/Point Size:/)).toBeTruthy();
  });

  it('calls onPointSizeChange when slider is moved', () => {
    const onPointSizeChange = vi.fn();
    render(<Visualization3DControls pointSize={0.05} onPointSizeChange={onPointSizeChange} />);
    fireEvent.click(screen.getByTitle('Show controls'));
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '0.1' } });
    expect(onPointSizeChange).toHaveBeenCalledWith(0.1);
  });

  it('displays display options checkboxes', () => {
    const onShowGridChange = vi.fn();
    const onShowAxesChange = vi.fn();
    render(
      <Visualization3DControls
        showGrid={true}
        onShowGridChange={onShowGridChange}
        showAxes={true}
        onShowAxesChange={onShowAxesChange}
      />
    );
    fireEvent.click(screen.getByTitle('Show controls'));
    expect(screen.getByText('Display Options')).toBeTruthy();
    expect(screen.getByText('Show Grid')).toBeTruthy();
    expect(screen.getByText('Show Axes')).toBeTruthy();
  });

  it('calls onShowGridChange when grid checkbox is toggled', () => {
    const onShowGridChange = vi.fn();
    render(<Visualization3DControls showGrid={true} onShowGridChange={onShowGridChange} />);
    fireEvent.click(screen.getByTitle('Show controls'));
    const checkbox = screen.getByText('Show Grid').previousElementSibling as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(onShowGridChange).toHaveBeenCalledWith(false);
  });

  it('displays reset camera button', () => {
    const onResetCamera = vi.fn();
    render(<Visualization3DControls onResetCamera={onResetCamera} />);
    fireEvent.click(screen.getByTitle('Show controls'));
    expect(screen.getByText('Reset')).toBeTruthy();
  });

  it('calls onResetCamera when reset button is clicked', () => {
    const onResetCamera = vi.fn();
    render(<Visualization3DControls onResetCamera={onResetCamera} />);
    fireEvent.click(screen.getByTitle('Show controls'));
    fireEvent.click(screen.getByText('Reset'));
    expect(onResetCamera).toHaveBeenCalled();
  });

  it('displays export button', () => {
    const onExport = vi.fn();
    render(<Visualization3DControls onExport={onExport} />);
    fireEvent.click(screen.getByTitle('Show controls'));
    expect(screen.getByText('Export')).toBeTruthy();
  });

  it('calls onExport when export button is clicked', () => {
    const onExport = vi.fn();
    render(<Visualization3DControls onExport={onExport} />);
    fireEvent.click(screen.getByTitle('Show controls'));
    fireEvent.click(screen.getByText('Export'));
    expect(onExport).toHaveBeenCalled();
  });
});

describe('exportVisualizationData', () => {
  it('creates and downloads a JSON file', () => {
    const mockData = { test: 'data', value: 123 };
    const createElementSpy = vi.spyOn(document, 'createElement');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    exportVisualizationData(mockData, 'test.json');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });
});
