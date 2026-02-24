import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { useUIStore } from '@/features/stores/uiStore';

describe('Sidebar', () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarCollapsed: false });
  });

  it('should render all navigation items', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    // Check for all navigation items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText('Topics')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('Faults')).toBeInTheDocument();
    expect(screen.getByText('Visualizations')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
  });

  it('should render navigation links with correct paths', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/');

    const componentsLink = screen.getByText('Components').closest('a');
    expect(componentsLink).toHaveAttribute('href', '/components');

    const topicsLink = screen.getByText('Topics').closest('a');
    expect(topicsLink).toHaveAttribute('href', '/topics');
  });

  it('should show text labels when sidebar is expanded', () => {
    useUIStore.setState({ sidebarCollapsed: false });
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    // All text labels should be visible
    expect(screen.getByText('Dashboard')).toBeVisible();
    expect(screen.getByText('Components')).toBeVisible();
  });

  it('should apply collapsed width class when sidebar is collapsed', () => {
    useUIStore.setState({ sidebarCollapsed: true });
    const { container } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('w-16');
  });

  it('should apply expanded width class when sidebar is expanded', () => {
    useUIStore.setState({ sidebarCollapsed: false });
    const { container } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('w-64');
  });

  it('should have proper accessibility attributes', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    // Check that navigation is properly structured
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });
});
