import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';

describe('AppShell', () => {
  it('should render with header, sidebar, main content, and footer', () => {
    render(
      <MemoryRouter>
        <AppShell>
          <div data-testid="main-content">Test Content</div>
        </AppShell>
      </MemoryRouter>
    );

    // Check that main content is rendered
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();

    // Check that header is rendered (look for logo)
    expect(screen.getByText('Dojo Robot Dashboard')).toBeInTheDocument();

    // Check that sidebar navigation items are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText('Topics')).toBeInTheDocument();

    // Check that status bar is rendered
    expect(screen.getByText(/Last connected:/)).toBeInTheDocument();
  });

  it('should render children in main content area', () => {
    const testContent = 'Custom Dashboard Content';
    render(
      <MemoryRouter>
        <AppShell>
          <h1>{testContent}</h1>
        </AppShell>
      </MemoryRouter>
    );

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it('should have proper layout structure', () => {
    const { container } = render(
      <MemoryRouter>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </MemoryRouter>
    );

    // Check for main layout container
    const mainLayout = container.querySelector('.flex.h-screen.flex-col');
    expect(mainLayout).toBeInTheDocument();
  });
});
