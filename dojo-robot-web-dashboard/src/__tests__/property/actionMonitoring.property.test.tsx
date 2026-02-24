/**
 * Property-based tests for action monitoring
 * 
 * **Validates: Requirements 5.7, 5.8**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExecutionMonitor } from '@/components/operations/ExecutionMonitor';
import { apiClient } from '@/features/api/client';
import type { Execution } from '@/types/api';

// Mock the API client
vi.mock('@/features/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

// Test wrapper with React Query provider
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Arbitraries for generating test data
const executionStatusArb = fc.constantFrom(
  'pending',
  'running',
  'succeeded',
  'failed',
  'cancelled'
) as fc.Arbitrary<Execution['status']>;

const executionArb = fc.record({
  id: fc.uuid(),
  operationId: fc.uuid(),
  status: executionStatusArb,
  progress: fc.option(fc.double({ min: 0, max: 1 }), { nil: undefined }),
  feedback: fc.option(fc.jsonValue(), { nil: undefined }),
  result: fc.option(fc.jsonValue(), { nil: undefined }),
  error: fc.option(fc.string(), { nil: undefined }),
  startTime: fc.date().map((d) => d.toISOString()),
  endTime: fc.option(fc.date().map((d) => d.toISOString()), { nil: undefined }),
}) as fc.Arbitrary<Execution>;

describe('Action Monitoring - Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 22: Action Status Polling', () => {
    /**
     * **Property 22: Action status polling**
     * 
     * For any action execution with status "running" or "pending", the dashboard
     * should poll the execution status from GET /api/v1/components/{component_id}/operations/{operation_id}/executions/{execution_id}
     * at regular intervals.
     * 
     * **Validates: Requirements 5.7**
     */
    it('should poll execution status for active executions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            execution: executionArb.filter((e) => e.status === 'running' || e.status === 'pending'),
            componentId: fc.uuid(),
            operationId: fc.uuid(),
          }),
          async ({ execution, componentId, operationId }) => {
            // Mock API response
            const mockGet = vi.mocked(apiClient.get);
            mockGet.mockResolvedValue({ data: execution });

            render(
              <TestWrapper>
                <ExecutionMonitor
                  componentId={componentId}
                  operationId={operationId}
                  executionId={execution.id}
                  pollingInterval={100} // Fast polling for tests
                />
              </TestWrapper>
            );

            // Wait for initial fetch
            await waitFor(() => {
              expect(mockGet).toHaveBeenCalledWith(
                `/components/${componentId}/operations/${operationId}/executions/${execution.id}`
              );
            });

            // Verify polling indicator is shown for active executions
            const pollingText = await screen.findByText(/polling for updates/i);
            expect(pollingText).toBeTruthy();

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should stop polling when execution is complete', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            execution: executionArb.filter((e) => 
              e.status === 'succeeded' || e.status === 'failed' || e.status === 'cancelled'
            ),
            componentId: fc.uuid(),
            operationId: fc.uuid(),
          }),
          async ({ execution, componentId, operationId }) => {
            // Mock API response
            const mockGet = vi.mocked(apiClient.get);
            mockGet.mockResolvedValue({ data: execution });

            const { container } = render(
              <TestWrapper>
                <ExecutionMonitor
                  componentId={componentId}
                  operationId={operationId}
                  executionId={execution.id}
                  pollingInterval={100}
                />
              </TestWrapper>
            );

            // Wait for initial fetch
            await waitFor(() => {
              expect(mockGet).toHaveBeenCalled();
            });

            // Verify polling indicator is NOT shown for completed executions
            const pollingText = container.querySelector('*:contains("Polling for updates")');
            expect(pollingText).toBeFalsy();

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 23: Action Progress Display', () => {
    /**
     * **Property 23: Action progress display**
     * 
     * For any action execution, the dashboard should display the current status,
     * and if progress or feedback data is available, it should be displayed.
     * 
     * **Validates: Requirements 5.8**
     */
    it('should display execution status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            execution: executionArb,
            componentId: fc.uuid(),
            operationId: fc.uuid(),
          }),
          async ({ execution, componentId, operationId }) => {
            // Mock API response
            const mockGet = vi.mocked(apiClient.get);
            mockGet.mockResolvedValue({ data: execution });

            render(
              <TestWrapper>
                <ExecutionMonitor
                  componentId={componentId}
                  operationId={operationId}
                  executionId={execution.id}
                />
              </TestWrapper>
            );

            // Wait for status to be displayed
            await waitFor(() => {
              const statusText = screen.getByText(new RegExp(execution.status, 'i'));
              expect(statusText).toBeTruthy();
            });

            return true;
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should display progress bar when progress is available', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            execution: executionArb.filter((e) => 
              e.progress !== undefined && (e.status === 'running' || e.status === 'pending')
            ),
            componentId: fc.uuid(),
            operationId: fc.uuid(),
          }),
          async ({ execution, componentId, operationId }) => {
            // Mock API response
            const mockGet = vi.mocked(apiClient.get);
            mockGet.mockResolvedValue({ data: execution });

            const { container } = render(
              <TestWrapper>
                <ExecutionMonitor
                  componentId={componentId}
                  operationId={operationId}
                  executionId={execution.id}
                />
              </TestWrapper>
            );

            // Wait for progress bar to be displayed
            await waitFor(() => {
              const progressBar = container.querySelector('[role="progressbar"]');
              expect(progressBar).toBeTruthy();
              
              // Verify progress value
              const progressValue = progressBar?.getAttribute('aria-valuenow');
              expect(Number(progressValue)).toBeCloseTo(execution.progress! * 100, 0);
            });

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should display feedback data when available', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            execution: executionArb.filter((e) => e.feedback !== undefined),
            componentId: fc.uuid(),
            operationId: fc.uuid(),
          }),
          async ({ execution, componentId, operationId }) => {
            // Mock API response
            const mockGet = vi.mocked(apiClient.get);
            mockGet.mockResolvedValue({ data: execution });

            render(
              <TestWrapper>
                <ExecutionMonitor
                  componentId={componentId}
                  operationId={operationId}
                  executionId={execution.id}
                />
              </TestWrapper>
            );

            // Wait for feedback section to be displayed
            await waitFor(() => {
              const feedbackLabel = screen.getByText(/feedback/i);
              expect(feedbackLabel).toBeTruthy();
            });

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should display result data for succeeded executions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            execution: executionArb.filter((e) => 
              e.status === 'succeeded' && e.result !== undefined
            ),
            componentId: fc.uuid(),
            operationId: fc.uuid(),
          }),
          async ({ execution, componentId, operationId }) => {
            // Mock API response
            const mockGet = vi.mocked(apiClient.get);
            mockGet.mockResolvedValue({ data: execution });

            render(
              <TestWrapper>
                <ExecutionMonitor
                  componentId={componentId}
                  operationId={operationId}
                  executionId={execution.id}
                />
              </TestWrapper>
            );

            // Wait for result section to be displayed
            await waitFor(() => {
              const resultLabel = screen.getByText(/result/i);
              expect(resultLabel).toBeTruthy();
            });

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should display error message for failed executions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            execution: executionArb.filter((e) => 
              e.status === 'failed' && e.error !== undefined && e.error !== ''
            ),
            componentId: fc.uuid(),
            operationId: fc.uuid(),
          }),
          async ({ execution, componentId, operationId }) => {
            // Mock API response
            const mockGet = vi.mocked(apiClient.get);
            mockGet.mockResolvedValue({ data: execution });

            render(
              <TestWrapper>
                <ExecutionMonitor
                  componentId={componentId}
                  operationId={operationId}
                  executionId={execution.id}
                />
              </TestWrapper>
            );

            // Wait for error message to be displayed
            await waitFor(() => {
              const errorText = screen.getByText(execution.error!);
              expect(errorText).toBeTruthy();
            });

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should show cancel button for active executions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            execution: executionArb.filter((e) => e.status === 'running' || e.status === 'pending'),
            componentId: fc.uuid(),
            operationId: fc.uuid(),
          }),
          async ({ execution, componentId, operationId }) => {
            // Mock API response
            const mockGet = vi.mocked(apiClient.get);
            mockGet.mockResolvedValue({ data: execution });

            render(
              <TestWrapper>
                <ExecutionMonitor
                  componentId={componentId}
                  operationId={operationId}
                  executionId={execution.id}
                />
              </TestWrapper>
            );

            // Wait for cancel button to be displayed
            await waitFor(() => {
              const cancelButton = screen.getByRole('button', { name: /cancel/i });
              expect(cancelButton).toBeTruthy();
            });

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
