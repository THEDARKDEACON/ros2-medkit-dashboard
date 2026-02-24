/**
 * Property-based tests for fault display
 * Tests Properties 33 and 34
 * **Validates: Requirements 7.5, 7.4**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FaultMonitor } from '../../components/faults/FaultMonitor';
import * as hooks from '../../features/api/hooks';
import type { Fault } from '../../types/api';

// Mock the API hooks
vi.mock('../../features/api/hooks');

// Mock the SSE manager
vi.mock('../../features/realtime/sseManager', () => ({
  getFaultSSEManager: () => ({
    connect: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    disconnect: vi.fn(),
  }),
}));

/**
 * Helper to create a test wrapper with QueryClient
 */
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Fault Display Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 33: Fault Display Completeness', () => {
    /**
     * **Validates: Requirements 7.5**
     * 
     * For any fault displayed in the fault monitor, the rendered output should include
     * the fault code, message, component source, and timestamp.
     */
    it('should display fault code, message, component source, and timestamp for any fault', () => {
      // Test with multiple concrete fault examples
      const testCases: Fault[] = [
        {
          code: 'FAULT_NAV_001',
          message: 'Navigation path planning failed',
          severity: 'error',
          componentId: 'nav_controller',
          timestamp: '2024-01-15T10:30:00Z',
        },
        {
          code: 'FAULT_SENSOR_042',
          message: 'Lidar sensor data quality degraded',
          severity: 'warning',
          componentId: 'sensor_manager',
          timestamp: '2024-01-15T10:31:00Z',
        },
        {
          code: 'FAULT_INFO_123',
          message: 'System configuration updated',
          severity: 'info',
          componentId: 'config_service',
          timestamp: '2024-01-15T10:32:00Z',
        },
        {
          code: 'FAULT_PERC_999',
          message: 'Object detection confidence below threshold',
          severity: 'warning',
          componentId: 'perception_module',
          timestamp: '2024-01-15T10:33:00Z',
        },
      ];

      testCases.forEach((fault) => {
        // Mock the useFaults hook to return our test fault
        vi.mocked(hooks.useFaults).mockReturnValue({
          data: [fault],
          isLoading: false,
          error: null,
        } as any);

        const { container, unmount } = render(<FaultMonitor />, {
          wrapper: createWrapper(),
        });

        // Check that fault code is displayed (in font-mono class)
        const codeElements = container.querySelectorAll('.font-mono');
        const codeTexts = Array.from(codeElements).map(el => el.textContent);
        expect(codeTexts).toContain(fault.code);

        // Check that message is displayed
        expect(screen.getByText(fault.message)).toBeInTheDocument();

        // Check that component ID is displayed (use testid to avoid ambiguity with filter dropdown)
        expect(screen.getByTestId(`fault-component-${fault.code}`)).toHaveTextContent(fault.componentId);

        // Check that timestamp is present (formatted as relative time or absolute)
        const timestampRegex = /(\d+[smh] ago|:\d{2})/;
        const hasTimestamp = timestampRegex.test(container.textContent || '');
        expect(hasTimestamp).toBe(true);

        unmount();
      });
    });

    it('should display all required fields for faults with metadata', () => {
      const faultWithMetadata: Fault = {
        code: 'FAULT_COMPLEX',
        message: 'Complex fault with additional metadata',
        severity: 'error',
        componentId: 'complex_component',
        timestamp: '2024-01-15T10:30:00Z',
        metadata: {
          errorCode: 500,
          details: 'Additional information',
        },
      };

      vi.mocked(hooks.useFaults).mockReturnValue({
        data: [faultWithMetadata],
        isLoading: false,
        error: null,
      } as any);

      const { container } = render(<FaultMonitor />, {
        wrapper: createWrapper(),
      });

      // All required fields should still be present even with metadata
      expect(screen.getByText(faultWithMetadata.code)).toBeInTheDocument();
      expect(screen.getByText(faultWithMetadata.message)).toBeInTheDocument();
      expect(screen.getByTestId(`fault-component-${faultWithMetadata.code}`)).toHaveTextContent(faultWithMetadata.componentId);
      
      const timestampRegex = /(\d+[smh] ago|:\d{2})/;
      expect(timestampRegex.test(container.textContent || '')).toBe(true);
    });

    it('should display fault code in monospace font', () => {
      const fault: Fault = {
        code: 'FAULT_TEST_001',
        message: 'Test fault message',
        severity: 'info',
        componentId: 'test_component',
        timestamp: '2024-01-15T10:30:00Z',
      };

      vi.mocked(hooks.useFaults).mockReturnValue({
        data: [fault],
        isLoading: false,
        error: null,
      } as any);

      const { container } = render(<FaultMonitor />, {
        wrapper: createWrapper(),
      });

      // Fault code should be in an element with font-mono class
      const monoElements = container.querySelectorAll('.font-mono');
      const monoTexts = Array.from(monoElements).map(el => el.textContent);
      expect(monoTexts).toContain(fault.code);
    });

    it('should display severity badge for each fault', () => {
      const testCases: Fault[] = [
        {
          code: 'FAULT_ERROR',
          message: 'Error message',
          severity: 'error',
          componentId: 'comp_1',
          timestamp: '2024-01-15T10:30:00Z',
        },
        {
          code: 'FAULT_WARNING',
          message: 'Warning message',
          severity: 'warning',
          componentId: 'comp_2',
          timestamp: '2024-01-15T10:31:00Z',
        },
        {
          code: 'FAULT_INFO',
          message: 'Info message',
          severity: 'info',
          componentId: 'comp_3',
          timestamp: '2024-01-15T10:32:00Z',
        },
      ];

      testCases.forEach((fault) => {
        vi.mocked(hooks.useFaults).mockReturnValue({
          data: [fault],
          isLoading: false,
          error: null,
        } as any);

        const { unmount } = render(<FaultMonitor />, {
          wrapper: createWrapper(),
        });

        // Severity should be displayed as uppercase badge
        expect(screen.getByText(fault.severity.toUpperCase())).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Property 34: Fault Sorting', () => {
    /**
     * **Validates: Requirements 7.4**
     * 
     * For any list of faults, the displayed faults should be sorted first by severity
     * (error > warning > info) and then by timestamp (most recent first).
     */
    it('should sort faults by severity (error > warning > info) then by timestamp (most recent first)', () => {
      const testCases = [
        // Test case 1: Mixed severities and timestamps
        {
          faults: [
            {
              code: 'FAULT_INFO_1',
              message: 'Info message 1',
              severity: 'info' as const,
              componentId: 'comp_1',
              timestamp: '2024-01-15T10:35:00Z', // Most recent info
            },
            {
              code: 'FAULT_ERROR_1',
              message: 'Error message 1',
              severity: 'error' as const,
              componentId: 'comp_2',
              timestamp: '2024-01-15T10:30:00Z', // Oldest error
            },
            {
              code: 'FAULT_WARNING_1',
              message: 'Warning message 1',
              severity: 'warning' as const,
              componentId: 'comp_3',
              timestamp: '2024-01-15T10:33:00Z', // Most recent warning
            },
            {
              code: 'FAULT_ERROR_2',
              message: 'Error message 2',
              severity: 'error' as const,
              componentId: 'comp_4',
              timestamp: '2024-01-15T10:34:00Z', // Most recent error
            },
            {
              code: 'FAULT_WARNING_2',
              message: 'Warning message 2',
              severity: 'warning' as const,
              componentId: 'comp_5',
              timestamp: '2024-01-15T10:31:00Z', // Oldest warning
            },
          ],
          expectedOrder: [
            'FAULT_ERROR_2',   // Error, most recent
            'FAULT_ERROR_1',   // Error, older
            'FAULT_WARNING_1', // Warning, most recent
            'FAULT_WARNING_2', // Warning, older
            'FAULT_INFO_1',    // Info
          ],
        },
        // Test case 2: All same severity, different timestamps
        {
          faults: [
            {
              code: 'FAULT_A',
              message: 'Message A',
              severity: 'warning' as const,
              componentId: 'comp_a',
              timestamp: '2024-01-15T10:30:00Z',
            },
            {
              code: 'FAULT_B',
              message: 'Message B',
              severity: 'warning' as const,
              componentId: 'comp_b',
              timestamp: '2024-01-15T10:35:00Z', // Most recent
            },
            {
              code: 'FAULT_C',
              message: 'Message C',
              severity: 'warning' as const,
              componentId: 'comp_c',
              timestamp: '2024-01-15T10:32:00Z',
            },
          ],
          expectedOrder: ['FAULT_B', 'FAULT_C', 'FAULT_A'],
        },
        // Test case 3: All different severities, same timestamp
        {
          faults: [
            {
              code: 'FAULT_INFO',
              message: 'Info message',
              severity: 'info' as const,
              componentId: 'comp_1',
              timestamp: '2024-01-15T10:30:00Z',
            },
            {
              code: 'FAULT_ERROR',
              message: 'Error message',
              severity: 'error' as const,
              componentId: 'comp_2',
              timestamp: '2024-01-15T10:30:00Z',
            },
            {
              code: 'FAULT_WARNING',
              message: 'Warning message',
              severity: 'warning' as const,
              componentId: 'comp_3',
              timestamp: '2024-01-15T10:30:00Z',
            },
          ],
          expectedOrder: ['FAULT_ERROR', 'FAULT_WARNING', 'FAULT_INFO'],
        },
      ];

      testCases.forEach(({ faults, expectedOrder }) => {
        vi.mocked(hooks.useFaults).mockReturnValue({
          data: faults,
          isLoading: false,
          error: null,
        } as any);

        const { container, unmount } = render(<FaultMonitor />, {
          wrapper: createWrapper(),
        });

        // Extract displayed fault codes in order
        const faultElements = container.querySelectorAll('.font-mono');
        const displayedCodes = Array.from(faultElements).map(
          (el) => el.textContent?.trim() || ''
        );

        // Verify the order matches expected
        expect(displayedCodes).toEqual(expectedOrder);

        unmount();
      });
    });

    it('should prioritize errors over warnings and info regardless of timestamp', () => {
      const faults: Fault[] = [
        {
          code: 'FAULT_INFO',
          message: 'Info message - most recent',
          severity: 'info',
          componentId: 'comp_1',
          timestamp: '2024-01-15T10:35:00Z', // Most recent overall
        },
        {
          code: 'FAULT_ERROR',
          message: 'Error message - oldest',
          severity: 'error',
          componentId: 'comp_2',
          timestamp: '2024-01-15T10:30:00Z', // Oldest overall
        },
        {
          code: 'FAULT_WARNING',
          message: 'Warning message',
          severity: 'warning',
          componentId: 'comp_3',
          timestamp: '2024-01-15T10:33:00Z',
        },
      ];

      vi.mocked(hooks.useFaults).mockReturnValue({
        data: faults,
        isLoading: false,
        error: null,
      } as any);

      const { container } = render(<FaultMonitor />, {
        wrapper: createWrapper(),
      });

      const faultElements = container.querySelectorAll('.font-mono');
      const displayedCodes = Array.from(faultElements).map(
        (el) => el.textContent?.trim() || ''
      );

      // Error should be first despite being oldest
      expect(displayedCodes[0]).toBe('FAULT_ERROR');
      // Warning should be second
      expect(displayedCodes[1]).toBe('FAULT_WARNING');
      // Info should be last despite being most recent
      expect(displayedCodes[2]).toBe('FAULT_INFO');
    });

    it('should sort faults with same severity by timestamp (most recent first)', () => {
      const testCases = [
        {
          severity: 'error' as const,
          faults: [
            {
              code: 'FAULT_ERROR_OLD',
              message: 'Old error',
              severity: 'error' as const,
              componentId: 'comp_1',
              timestamp: '2024-01-15T10:30:00Z',
            },
            {
              code: 'FAULT_ERROR_NEW',
              message: 'New error',
              severity: 'error' as const,
              componentId: 'comp_2',
              timestamp: '2024-01-15T10:35:00Z',
            },
            {
              code: 'FAULT_ERROR_MID',
              message: 'Mid error',
              severity: 'error' as const,
              componentId: 'comp_3',
              timestamp: '2024-01-15T10:32:00Z',
            },
          ],
          expectedOrder: ['FAULT_ERROR_NEW', 'FAULT_ERROR_MID', 'FAULT_ERROR_OLD'],
        },
        {
          severity: 'warning' as const,
          faults: [
            {
              code: 'FAULT_WARN_1',
              message: 'Warning 1',
              severity: 'warning' as const,
              componentId: 'comp_1',
              timestamp: '2024-01-15T10:31:00Z',
            },
            {
              code: 'FAULT_WARN_2',
              message: 'Warning 2',
              severity: 'warning' as const,
              componentId: 'comp_2',
              timestamp: '2024-01-15T10:33:00Z',
            },
          ],
          expectedOrder: ['FAULT_WARN_2', 'FAULT_WARN_1'],
        },
      ];

      testCases.forEach(({ faults, expectedOrder }) => {
        vi.mocked(hooks.useFaults).mockReturnValue({
          data: faults,
          isLoading: false,
          error: null,
        } as any);

        const { container, unmount } = render(<FaultMonitor />, {
          wrapper: createWrapper(),
        });

        const faultElements = container.querySelectorAll('.font-mono');
        const displayedCodes = Array.from(faultElements).map(
          (el) => el.textContent?.trim() || ''
        );

        expect(displayedCodes).toEqual(expectedOrder);

        unmount();
      });
    });

    it('should maintain correct sort order with multiple faults of each severity', () => {
      const faults: Fault[] = [
        // Errors
        {
          code: 'ERROR_1',
          message: 'Error 1',
          severity: 'error',
          componentId: 'comp_1',
          timestamp: '2024-01-15T10:30:00Z',
        },
        {
          code: 'ERROR_2',
          message: 'Error 2',
          severity: 'error',
          componentId: 'comp_2',
          timestamp: '2024-01-15T10:35:00Z',
        },
        // Warnings
        {
          code: 'WARNING_1',
          message: 'Warning 1',
          severity: 'warning',
          componentId: 'comp_3',
          timestamp: '2024-01-15T10:31:00Z',
        },
        {
          code: 'WARNING_2',
          message: 'Warning 2',
          severity: 'warning',
          componentId: 'comp_4',
          timestamp: '2024-01-15T10:36:00Z',
        },
        // Info
        {
          code: 'INFO_1',
          message: 'Info 1',
          severity: 'info',
          componentId: 'comp_5',
          timestamp: '2024-01-15T10:32:00Z',
        },
        {
          code: 'INFO_2',
          message: 'Info 2',
          severity: 'info',
          componentId: 'comp_6',
          timestamp: '2024-01-15T10:37:00Z',
        },
      ];

      vi.mocked(hooks.useFaults).mockReturnValue({
        data: faults,
        isLoading: false,
        error: null,
      } as any);

      const { container } = render(<FaultMonitor />, {
        wrapper: createWrapper(),
      });

      const faultElements = container.querySelectorAll('.font-mono');
      const displayedCodes = Array.from(faultElements).map(
        (el) => el.textContent?.trim() || ''
      );

      // Expected order: errors (newest first), warnings (newest first), info (newest first)
      const expectedOrder = [
        'ERROR_2',    // Error, most recent
        'ERROR_1',    // Error, older
        'WARNING_2',  // Warning, most recent
        'WARNING_1',  // Warning, older
        'INFO_2',     // Info, most recent
        'INFO_1',     // Info, older
      ];

      expect(displayedCodes).toEqual(expectedOrder);
    });

    it('should handle edge case of single fault', () => {
      const fault: Fault = {
        code: 'SINGLE_FAULT',
        message: 'Single fault message',
        severity: 'warning',
        componentId: 'comp_1',
        timestamp: '2024-01-15T10:30:00Z',
      };

      vi.mocked(hooks.useFaults).mockReturnValue({
        data: [fault],
        isLoading: false,
        error: null,
      } as any);

      const { container } = render(<FaultMonitor />, {
        wrapper: createWrapper(),
      });

      const faultElements = container.querySelectorAll('.font-mono');
      expect(faultElements).toHaveLength(1);
      expect(faultElements[0].textContent).toBe('SINGLE_FAULT');
    });

    it('should handle faults with identical timestamps correctly', () => {
      const timestamp = '2024-01-15T10:30:00Z';
      const faults: Fault[] = [
        {
          code: 'FAULT_1',
          message: 'Message 1',
          severity: 'error',
          componentId: 'comp_1',
          timestamp,
        },
        {
          code: 'FAULT_2',
          message: 'Message 2',
          severity: 'error',
          componentId: 'comp_2',
          timestamp,
        },
        {
          code: 'FAULT_3',
          message: 'Message 3',
          severity: 'warning',
          componentId: 'comp_3',
          timestamp,
        },
      ];

      vi.mocked(hooks.useFaults).mockReturnValue({
        data: faults,
        isLoading: false,
        error: null,
      } as any);

      const { container } = render(<FaultMonitor />, {
        wrapper: createWrapper(),
      });

      const faultElements = container.querySelectorAll('.font-mono');
      const displayedCodes = Array.from(faultElements).map(
        (el) => el.textContent?.trim() || ''
      );

      // Errors should come before warnings
      expect(displayedCodes.indexOf('FAULT_1')).toBeLessThan(displayedCodes.indexOf('FAULT_3'));
      expect(displayedCodes.indexOf('FAULT_2')).toBeLessThan(displayedCodes.indexOf('FAULT_3'));
      
      // Both errors should be present
      expect(displayedCodes).toContain('FAULT_1');
      expect(displayedCodes).toContain('FAULT_2');
      expect(displayedCodes).toContain('FAULT_3');
    });
  });
});
