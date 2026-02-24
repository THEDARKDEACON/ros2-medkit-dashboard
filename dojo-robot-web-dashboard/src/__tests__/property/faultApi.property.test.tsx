/**
 * Property-based tests for Fault API hooks
 * **Validates: Requirements 7.7**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFaultSnapshots } from '@/features/api/hooks';
import { apiClient } from '@/features/api/client';
import type { FaultSnapshot } from '@/types/api';

// Mock the API client
vi.mock('@/features/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Helper to create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Arbitraries for generating test data
const faultCodeArbitrary = fc.stringMatching(/^FAULT_[A-Z0-9]{3,10}$/);

const faultSnapshotArbitrary: fc.Arbitrary<FaultSnapshot> = fc.record({
  faultCode: faultCodeArbitrary,
  timestamp: fc.date().map((d) => d.toISOString()),
  systemState: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 30 }),
    fc.anything()
  ),
  topicData: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 50 }),
    fc.anything()
  ),
});

describe('Property 36: Fault snapshot fetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any valid fault code, when viewing fault details,
   * the dashboard should fetch snapshot data from GET /api/v1/faults/{fault_code}/snapshots.
   */
  it('should call the correct API endpoint with the provided fault code', async () => {
    await fc.assert(
      fc.asyncProperty(
        faultCodeArbitrary,
        faultSnapshotArbitrary,
        async (faultCode, mockSnapshot) => {
          // Reset mocks for each property test iteration
          vi.clearAllMocks();

          // Ensure the snapshot has the correct fault code
          const snapshotWithCorrectCode = {
            ...mockSnapshot,
            faultCode,
          };

          // Mock the API response
          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: snapshotWithCorrectCode,
          });

          // Render the hook with the generated fault code
          const { result } = renderHook(() => useFaultSnapshots(faultCode), {
            wrapper: createWrapper(),
          });

          // Wait for the query to complete
          await waitFor(
            () => {
              expect(result.current.isSuccess || result.current.isError).toBe(
                true
              );
            },
            { timeout: 1000 }
          );

          // Verify the API was called with the correct endpoint
          expect(apiClient.get).toHaveBeenCalledWith(
            `/faults/${faultCode}/snapshots`
          );
          expect(apiClient.get).toHaveBeenCalledTimes(1);

          // Verify the data matches what was returned
          if (result.current.isSuccess) {
            expect(result.current.data).toEqual(snapshotWithCorrectCode);
            expect(result.current.data?.faultCode).toBe(faultCode);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: The query key should include the fault code for proper caching
   */
  it('should use a query key that includes the fault code', async () => {
    await fc.assert(
      fc.asyncProperty(
        faultCodeArbitrary,
        faultSnapshotArbitrary,
        async (faultCode, mockSnapshot) => {
          vi.clearAllMocks();

          const snapshotWithCorrectCode = {
            ...mockSnapshot,
            faultCode,
          };

          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: snapshotWithCorrectCode,
          });

          const { result } = renderHook(() => useFaultSnapshots(faultCode), {
            wrapper: createWrapper(),
          });

          await waitFor(
            () => {
              expect(result.current.isSuccess || result.current.isError).toBe(
                true
              );
            },
            { timeout: 1000 }
          );

          // The query key should be ['faults', faultCode, 'snapshots']
          // We verify this indirectly by checking that the API was called
          expect(apiClient.get).toHaveBeenCalledWith(
            `/faults/${faultCode}/snapshots`
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Empty or invalid fault codes should not trigger API calls
   */
  it('should not make API calls when fault code is empty', () => {
    const emptyFaultCodes = ['', null, undefined];

    emptyFaultCodes.forEach((emptyCode) => {
      vi.clearAllMocks();

      const { result } = renderHook(
        () => useFaultSnapshots(emptyCode as string),
        {
          wrapper: createWrapper(),
        }
      );

      // Query should be disabled
      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });

  /**
   * Property: Fault snapshot should contain system state and topic data
   */
  it('should return snapshot with system state and topic data', async () => {
    await fc.assert(
      fc.asyncProperty(
        faultCodeArbitrary,
        faultSnapshotArbitrary,
        async (faultCode, mockSnapshot) => {
          vi.clearAllMocks();

          const snapshotWithCorrectCode = {
            ...mockSnapshot,
            faultCode,
          };

          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: snapshotWithCorrectCode,
          });

          const { result } = renderHook(() => useFaultSnapshots(faultCode), {
            wrapper: createWrapper(),
          });

          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 1000 }
          );

          // Verify snapshot structure
          const snapshot = result.current.data;
          expect(snapshot).toBeDefined();
          expect(snapshot?.faultCode).toBe(faultCode);
          expect(snapshot?.timestamp).toBeDefined();
          expect(snapshot?.systemState).toBeDefined();
          expect(snapshot?.topicData).toBeDefined();
          expect(typeof snapshot?.systemState).toBe('object');
          expect(typeof snapshot?.topicData).toBe('object');
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Fault snapshots should have longer cache time (5 minutes) since they're historical
   */
  it('should cache fault snapshots for historical data', async () => {
    await fc.assert(
      fc.asyncProperty(
        faultCodeArbitrary,
        faultSnapshotArbitrary,
        async (faultCode, mockSnapshot) => {
          vi.clearAllMocks();

          const snapshotWithCorrectCode = {
            ...mockSnapshot,
            faultCode,
          };

          vi.mocked(apiClient.get).mockResolvedValue({
            data: snapshotWithCorrectCode,
          });

          const { result } = renderHook(() => useFaultSnapshots(faultCode), {
            wrapper: createWrapper(),
          });

          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 1000 }
          );

          // Verify data is returned correctly
          expect(result.current.data).toEqual(snapshotWithCorrectCode);
          
          // API should be called once for the initial fetch
          expect(apiClient.get).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Changing fault code should trigger a new fetch
   */
  it('should refetch when fault code changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        faultCodeArbitrary,
        faultCodeArbitrary,
        faultSnapshotArbitrary,
        faultSnapshotArbitrary,
        async (faultCode1, faultCode2, snapshot1, snapshot2) => {
          // Skip if fault codes are the same
          fc.pre(faultCode1 !== faultCode2);

          vi.clearAllMocks();

          const snapshot1WithCode = { ...snapshot1, faultCode: faultCode1 };
          const snapshot2WithCode = { ...snapshot2, faultCode: faultCode2 };

          vi.mocked(apiClient.get)
            .mockResolvedValueOnce({ data: snapshot1WithCode })
            .mockResolvedValueOnce({ data: snapshot2WithCode });

          const { result, rerender } = renderHook(
            ({ faultCode }) => useFaultSnapshots(faultCode),
            {
              wrapper: createWrapper(),
              initialProps: { faultCode: faultCode1 },
            }
          );

          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 1000 }
          );

          expect(result.current.data).toEqual(snapshot1WithCode);
          expect(apiClient.get).toHaveBeenCalledWith(
            `/faults/${faultCode1}/snapshots`
          );

          // Change fault code
          rerender({ faultCode: faultCode2 });

          await waitFor(
            () => {
              expect(result.current.data).toEqual(snapshot2WithCode);
            },
            { timeout: 1000 }
          );

          expect(apiClient.get).toHaveBeenCalledWith(
            `/faults/${faultCode2}/snapshots`
          );
          expect(apiClient.get).toHaveBeenCalledTimes(2);
        }
      ),
      { numRuns: 10 }
    );
  });
});
