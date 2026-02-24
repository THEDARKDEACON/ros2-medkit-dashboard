import { describe, it, expect } from 'vitest';
import { queryClient } from '../../lib/queryClient';

describe('QueryClient Configuration', () => {
  it('should have correct default query options', () => {
    const defaultOptions = queryClient.getDefaultOptions();

    expect(defaultOptions.queries?.staleTime).toBe(30 * 1000);
    expect(defaultOptions.queries?.gcTime).toBe(5 * 60 * 1000);
    expect(defaultOptions.queries?.retry).toBe(3);
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaultOptions.queries?.refetchOnReconnect).toBe(true);
    expect(defaultOptions.queries?.refetchOnMount).toBe(true);
  });

  it('should have correct default mutation options', () => {
    const defaultOptions = queryClient.getDefaultOptions();

    expect(defaultOptions.mutations?.retry).toBe(1);
    expect(defaultOptions.mutations?.retryDelay).toBe(1000);
  });

  it('should have exponential backoff retry delay', () => {
    const defaultOptions = queryClient.getDefaultOptions();
    const retryDelay = defaultOptions.queries?.retryDelay as (attemptIndex: number) => number;

    expect(retryDelay(0)).toBe(1000); // 2^0 * 1000
    expect(retryDelay(1)).toBe(2000); // 2^1 * 1000
    expect(retryDelay(2)).toBe(4000); // 2^2 * 1000
    expect(retryDelay(3)).toBe(8000); // 2^3 * 1000
    expect(retryDelay(10)).toBe(30000); // capped at 30000
  });
});
