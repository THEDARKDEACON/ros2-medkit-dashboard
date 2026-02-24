/**
 * Unit tests for AnimatedStatus component
 * **Validates: Requirements 26.4, 26.5**
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedStatus, StatusPulse } from '@/components/common/AnimatedStatus';

describe('AnimatedStatus', () => {
  describe('Status types', () => {
    it('should render success status', () => {
      render(<AnimatedStatus status="success" message="Operation successful" />);
      
      const status = screen.getByRole('status', { name: /success: operation successful/i });
      expect(status).toBeInTheDocument();
      expect(screen.getByText('Operation successful')).toBeInTheDocument();
    });

    it('should render error status', () => {
      render(<AnimatedStatus status="error" message="Operation failed" />);
      
      const status = screen.getByRole('status', { name: /error: operation failed/i });
      expect(status).toBeInTheDocument();
      expect(screen.getByText('Operation failed')).toBeInTheDocument();
    });

    it('should render warning status', () => {
      render(<AnimatedStatus status="warning" message="Warning message" />);
      
      const status = screen.getByRole('status', { name: /warning: warning message/i });
      expect(status).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });

    it('should render info status', () => {
      render(<AnimatedStatus status="info" message="Information" />);
      
      const status = screen.getByRole('status', { name: /information: information/i });
      expect(status).toBeInTheDocument();
      expect(screen.getByText('Information')).toBeInTheDocument();
    });

    it('should render loading status', () => {
      render(<AnimatedStatus status="loading" message="Loading..." />);
      
      const status = screen.getByRole('status', { name: /loading: loading\.\.\./i });
      expect(status).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<AnimatedStatus status="success" size="sm" />);
      
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('should render medium size', () => {
      render(<AnimatedStatus status="success" size="md" />);
      
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('should render large size', () => {
      render(<AnimatedStatus status="success" size="lg" />);
      
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });
  });

  describe('Icon visibility', () => {
    it('should show icon by default', () => {
      render(<AnimatedStatus status="success" message="Success" />);
      
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('should hide icon when showIcon is false', () => {
      render(<AnimatedStatus status="success" message="Success" showIcon={false} />);
      
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });

  describe('Without message', () => {
    it('should render without message', () => {
      render(<AnimatedStatus status="success" />);
      
      const status = screen.getByRole('status', { name: /success/i });
      expect(status).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      render(<AnimatedStatus status="success" message="Test message" />);
      
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Success: Test message');
    });

    it('should have aria-label without message', () => {
      render(<AnimatedStatus status="error" />);
      
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Error');
    });
  });
});

describe('StatusPulse', () => {
  it('should render active pulse', () => {
    render(<StatusPulse active={true} label="Connected" />);
    
    const status = screen.getByRole('status', { name: /connected/i });
    expect(status).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should render inactive pulse', () => {
    render(<StatusPulse active={false} label="Disconnected" />);
    
    const status = screen.getByRole('status', { name: /disconnected/i });
    expect(status).toBeInTheDocument();
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('should render without label', () => {
    render(<StatusPulse active={true} />);
    
    const status = screen.getByRole('status', { name: /connected/i });
    expect(status).toBeInTheDocument();
  });

  it('should render different sizes', () => {
    const { rerender } = render(<StatusPulse active={true} size="sm" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    rerender(<StatusPulse active={true} size="md" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    rerender(<StatusPulse active={true} size="lg" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
