/**
 * Unit tests for LoadingState component
 * **Validates: Requirements 10.7, 26.1**
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from '@/components/common/LoadingState';

describe('LoadingState', () => {
  describe('Spinner type', () => {
    it('should render spinner by default', () => {
      render(<LoadingState />);
      
      const status = screen.getByRole('status', { name: /loading content/i });
      expect(status).toBeInTheDocument();
      
      // Check for sr-only text
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<LoadingState message="Loading data..." />);
      
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should render small size spinner', () => {
      render(<LoadingState size="sm" />);
      
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('should render medium size spinner', () => {
      render(<LoadingState size="md" />);
      
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('should render large size spinner', () => {
      render(<LoadingState size="lg" />);
      
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      render(<LoadingState />);
      
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Loading content');
    });
  });

  describe('Skeleton type', () => {
    it('should render skeleton with default lines', () => {
      render(<LoadingState type="skeleton" />);
      
      const status = screen.getByRole('status', { name: /loading content/i });
      expect(status).toBeInTheDocument();
    });

    it('should render skeleton with custom number of lines', () => {
      render(<LoadingState type="skeleton" lines={5} />);
      
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('should render skeleton with message', () => {
      render(<LoadingState type="skeleton" message="Loading components..." />);
      
      expect(screen.getByText('Loading components...')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes for skeleton', () => {
      render(<LoadingState type="skeleton" />);
      
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Loading content');
      
      // Check for sr-only text
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});
