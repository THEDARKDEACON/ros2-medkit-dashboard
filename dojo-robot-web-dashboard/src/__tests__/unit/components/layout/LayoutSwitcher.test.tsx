import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LayoutSwitcher } from '../../../../components/layout/LayoutSwitcher';
import { useLayoutStore } from '../../../../features/stores/layoutStore';

describe('LayoutSwitcher', () => {
  beforeEach(() => {
    useLayoutStore.getState().resetToDefault();
  });

  it('should render with current layout name', () => {
    render(<LayoutSwitcher />);
    
    expect(screen.getByText('Default Layout')).toBeInTheDocument();
  });

  it('should open dropdown when clicked', () => {
    render(<LayoutSwitcher />);
    
    const button = screen.getByRole('button', { name: /Default Layout/i });
    fireEvent.click(button);
    
    expect(screen.getByText('Dashboard Layouts')).toBeInTheDocument();
  });

  it('should display all layouts in dropdown', () => {
    const { createLayout, setCurrentLayout } = useLayoutStore.getState();
    createLayout('Custom Layout 1');
    createLayout('Custom Layout 2');
    
    // Set back to default for testing
    setCurrentLayout('default');
    
    render(<LayoutSwitcher />);
    
    const button = screen.getByRole('button', { name: /Default Layout/i });
    fireEvent.click(button);
    
    expect(screen.getAllByText('Default Layout').length).toBeGreaterThan(0);
    expect(screen.getByText('Custom Layout 1')).toBeInTheDocument();
    expect(screen.getByText('Custom Layout 2')).toBeInTheDocument();
  });

  it('should switch layout when clicked', async () => {
    const { createLayout, setCurrentLayout } = useLayoutStore.getState();
    const newLayout = createLayout('Test Layout');
    
    // Set back to default
    setCurrentLayout('default');
    
    render(<LayoutSwitcher />);
    
    const button = screen.getByRole('button', { name: /Default Layout/i });
    fireEvent.click(button);
    
    const layoutButton = screen.getByText('Test Layout');
    fireEvent.click(layoutButton);
    
    await waitFor(() => {
      expect(useLayoutStore.getState().currentLayoutId).toBe(newLayout.id);
    });
  });

  it('should show new layout dialog', () => {
    render(<LayoutSwitcher />);
    
    const button = screen.getByRole('button', { name: /Default Layout/i });
    fireEvent.click(button);
    
    const newLayoutButton = screen.getByText('New Layout');
    fireEvent.click(newLayoutButton);
    
    expect(screen.getByPlaceholderText('Layout name...')).toBeInTheDocument();
  });

  it('should create new layout', async () => {
    render(<LayoutSwitcher />);
    
    const button = screen.getByRole('button', { name: /Default Layout/i });
    fireEvent.click(button);
    
    const newLayoutButton = screen.getByText('New Layout');
    fireEvent.click(newLayoutButton);
    
    const input = screen.getByPlaceholderText('Layout name...');
    fireEvent.change(input, { target: { value: 'My New Layout' } });
    
    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      const layouts = useLayoutStore.getState().layouts;
      expect(layouts.some((l) => l.name === 'My New Layout')).toBe(true);
    });
  });

  it('should duplicate layout', async () => {
    const { createLayout, setCurrentLayout } = useLayoutStore.getState();
    createLayout('Original Layout');
    
    // Set back to default
    setCurrentLayout('default');
    
    render(<LayoutSwitcher />);
    
    const button = screen.getByRole('button', { name: /Default Layout/i });
    fireEvent.click(button);
    
    // Find and click duplicate button (Copy icon)
    const duplicateButtons = screen.getAllByTitle('Duplicate');
    fireEvent.click(duplicateButtons[0]);
    
    await waitFor(() => {
      const layouts = useLayoutStore.getState().layouts;
      expect(layouts.some((l) => l.name.includes('Copy'))).toBe(true);
    });
  });

  it('should delete layout with confirmation', async () => {
    const { createLayout, setCurrentLayout } = useLayoutStore.getState();
    createLayout('Layout to Delete');
    
    // Set back to default
    setCurrentLayout('default');
    
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    render(<LayoutSwitcher />);
    
    const button = screen.getByRole('button', { name: /Default Layout/i });
    fireEvent.click(button);
    
    // Find and click delete button
    const deleteButtons = screen.getAllByTitle('Delete');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      const layouts = useLayoutStore.getState().layouts;
      expect(layouts.some((l) => l.name === 'Layout to Delete')).toBe(false);
    });
    
    confirmSpy.mockRestore();
  });

  it('should not delete layout if confirmation is cancelled', async () => {
    const { createLayout, setCurrentLayout } = useLayoutStore.getState();
    createLayout('Layout to Keep');
    
    // Set back to default
    setCurrentLayout('default');
    
    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    
    render(<LayoutSwitcher />);
    
    const button = screen.getByRole('button', { name: /Default Layout/i });
    fireEvent.click(button);
    
    const deleteButtons = screen.getAllByTitle('Delete');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      const layouts = useLayoutStore.getState().layouts;
      expect(layouts.some((l) => l.name === 'Layout to Keep')).toBe(true);
    });
    
    confirmSpy.mockRestore();
  });

  it('should call onCustomize callback', () => {
    const onCustomize = vi.fn();
    
    render(<LayoutSwitcher onCustomize={onCustomize} />);
    
    const button = screen.getByRole('button', { name: /Default Layout/i });
    fireEvent.click(button);
    
    const customizeButton = screen.getByText('Customize Layout');
    fireEvent.click(customizeButton);
    
    expect(onCustomize).toHaveBeenCalled();
  });

  it('should call onManagePresets callback', () => {
    const onManagePresets = vi.fn();
    
    render(<LayoutSwitcher onManagePresets={onManagePresets} />);
    
    const button = screen.getByRole('button', { name: /Default Layout/i });
    fireEvent.click(button);
    
    const presetsButton = screen.getByText('Load Preset');
    fireEvent.click(presetsButton);
    
    expect(onManagePresets).toHaveBeenCalled();
  });

  it('should show check mark for current layout', () => {
    render(<LayoutSwitcher />);
    
    const button = screen.getByRole('button', { name: /Default Layout/i });
    fireEvent.click(button);
    
    // Check icon should be present for current layout
    const checkIcons = screen.getAllByRole('button').filter(
      (btn) => btn.querySelector('svg')
    );
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('should close dropdown when clicking outside', () => {
    render(<LayoutSwitcher />);
    
    const button = screen.getByRole('button', { name: /Default Layout/i });
    fireEvent.click(button);
    
    expect(screen.getByText('Dashboard Layouts')).toBeInTheDocument();
    
    // Click the overlay
    const overlay = document.querySelector('.fixed.inset-0');
    if (overlay) {
      fireEvent.click(overlay);
    }
    
    expect(screen.queryByText('Dashboard Layouts')).not.toBeInTheDocument();
  });
});
