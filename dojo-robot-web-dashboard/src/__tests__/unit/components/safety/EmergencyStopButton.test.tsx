import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EmergencyStopButton } from '@/components/safety/EmergencyStopButton';
import * as hooks from '@/features/api/hooks';

// Mock the API hooks
vi.mock('@/features/api/hooks', async () => {
  const actual = await vi.importActual('@/features/api/hooks');
  return {
    ...actual,
    useTriggerEmergencyStop: vi.fn(),
  };
});

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('EmergencyStopButton', () => {
  let queryClient: QueryClient;
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();

    vi.mocked(hooks.useTriggerEmergencyStop).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      componentId: 'safety_component',
      isActive: false,
      size: 'lg' as const,
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <EmergencyStopButton {...defaultProps} {...props} />
      </QueryClientProvider>
    );
  };

  it('should render emergency stop button', () => {
    renderComponent();
    const button = screen.getByRole('button', { name: /emergency stop/i });
    expect(button).toBeInTheDocument();
  });

  it('should show confirmation dialog when clicked', async () => {
    renderComponent();
    const button = screen.getByRole('button', { name: /emergency stop/i });
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/activate emergency stop\?/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/this will immediately stop all robot motion/i)).toBeInTheDocument();
  });

  it('should trigger emergency stop when confirmed', async () => {
    mockMutateAsync.mockResolvedValue({});
    
    renderComponent();
    const button = screen.getByRole('button', { name: /emergency stop/i });
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/activate emergency stop\?/i)).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByRole('button', { name: /activate emergency stop/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ componentId: 'safety_component' });
    });
  });

  it('should close dialog when cancelled', async () => {
    renderComponent();
    const button = screen.getByRole('button', { name: /emergency stop/i });
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/activate emergency stop\?/i)).toBeInTheDocument();
    });
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/activate emergency stop\?/i)).not.toBeInTheDocument();
    });
  });

  it('should be disabled when emergency stop is active', () => {
    renderComponent({ isActive: true });
    const button = screen.getByRole('button', { name: /emergency stop/i });
    expect(button).toBeDisabled();
  });

  it('should show active indicator when emergency stop is active', () => {
    renderComponent({ isActive: true });
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('should show loading state when triggering emergency stop', () => {
    vi.mocked(hooks.useTriggerEmergencyStop).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as any);

    renderComponent();
    const button = screen.getByRole('button', { name: /emergency stop/i });
    expect(button).toBeDisabled();
  });

  it('should render with small size', () => {
    renderComponent({ size: 'sm' });
    const button = screen.getByRole('button', { name: /emergency stop/i });
    expect(button).toHaveClass('h-10', 'w-10');
  });

  it('should render with medium size', () => {
    renderComponent({ size: 'md' });
    const button = screen.getByRole('button', { name: /emergency stop/i });
    expect(button).toHaveClass('h-16', 'w-16');
  });

  it('should render with large size', () => {
    renderComponent({ size: 'lg' });
    const button = screen.getByRole('button', { name: /emergency stop/i });
    expect(button).toHaveClass('h-20', 'w-20');
  });

  it('should handle emergency stop error', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Failed to trigger emergency stop'));
    
    renderComponent();
    const button = screen.getByRole('button', { name: /emergency stop/i });
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/activate emergency stop\?/i)).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByRole('button', { name: /activate emergency stop/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
  });
});
