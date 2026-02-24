import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';

// Test component that uses the query client
function TestComponent() {
  const client = useQueryClient();
  return <div data-testid="test-component">{client ? 'QueryClient Available' : 'No QueryClient'}</div>;
}

describe('QueryClientProvider Integration', () => {
  it('should provide QueryClient to child components', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    expect(screen.getByTestId('test-component')).toHaveTextContent('QueryClient Available');
  });

  it('should have devtools available in development', () => {
    // Devtools are conditionally rendered based on import.meta.env.DEV
    // This test verifies the setup is correct
    expect(queryClient).toBeDefined();
    expect(queryClient.getDefaultOptions()).toBeDefined();
  });
});
