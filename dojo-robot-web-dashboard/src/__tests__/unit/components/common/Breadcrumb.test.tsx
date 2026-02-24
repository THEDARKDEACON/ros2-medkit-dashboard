import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Breadcrumb, type BreadcrumbItem } from '../../../../components/common/Breadcrumb';

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('Breadcrumb', () => {
  it('should render nothing when items array is empty', () => {
    const { container } = renderWithRouter(<Breadcrumb items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render home icon', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Components', path: '/components' },
    ];

    renderWithRouter(<Breadcrumb items={items} />);

    const homeLink = screen.getByLabelText('Home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should render all breadcrumb items', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Components', path: '/components' },
      { label: 'Navigation', path: '/components/nav' },
      { label: 'Details', path: '/components/nav/details' },
    ];

    renderWithRouter(<Breadcrumb items={items} />);

    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('should render last item as plain text (not a link)', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Components', path: '/components' },
      { label: 'Details', path: '/components/details' },
    ];

    renderWithRouter(<Breadcrumb items={items} />);

    const detailsElement = screen.getByText('Details');
    expect(detailsElement.tagName).toBe('SPAN');
    expect(detailsElement).toHaveAttribute('aria-current', 'page');
  });

  it('should render non-last items as links', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Components', path: '/components' },
      { label: 'Details', path: '/components/details' },
    ];

    renderWithRouter(<Breadcrumb items={items} />);

    const componentsLink = screen.getByText('Components').closest('a');
    expect(componentsLink).toBeInTheDocument();
    expect(componentsLink).toHaveAttribute('href', '/components');
  });

  it('should render chevron separators between items', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Components', path: '/components' },
      { label: 'Details', path: '/components/details' },
    ];

    const { container } = renderWithRouter(<Breadcrumb items={items} />);

    // Check for chevron icons (they have aria-hidden="true")
    const chevrons = container.querySelectorAll('[aria-hidden="true"]');
    // Should have at least 2 chevrons (one after home, one after Components)
    expect(chevrons.length).toBeGreaterThanOrEqual(2);
  });

  it('should have proper accessibility attributes', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Components', path: '/components' },
    ];

    renderWithRouter(<Breadcrumb items={items} />);

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(nav).toBeInTheDocument();
  });

  it('should handle single item breadcrumb', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Components', path: '/components' },
    ];

    renderWithRouter(<Breadcrumb items={items} />);

    expect(screen.getByText('Components')).toBeInTheDocument();
    const componentsElement = screen.getByText('Components');
    expect(componentsElement.tagName).toBe('SPAN');
    expect(componentsElement).toHaveAttribute('aria-current', 'page');
  });
});
