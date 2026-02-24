/**
 * Unit tests for EmptyState component
 * **Validates: Requirements 10.10**
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileX } from 'lucide-react';
import {
  EmptyState,
  EmptySearchResults,
  EmptyErrorState,
  EmptyDataState,
} from '@/components/common/EmptyState';

describe('EmptyState', () => {
  it('should render with title', () => {
    render(<EmptyState title="No data available" />);
    
    const status = screen.getByRole('status', { name: /no data available/i });
    expect(status).toBeInTheDocument();
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should render with title and description', () => {
    render(
      <EmptyState
        title="No items found"
        description="There are no items to display at this time."
      />
    );
    
    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display at this time.')).toBeInTheDocument();
  });

  it('should render with custom icon', () => {
    render(
      <EmptyState
        icon={FileX}
        title="No files"
        description="No files available"
      />
    );
    
    expect(screen.getByText('No files')).toBeInTheDocument();
  });

  it('should render action button when provided', () => {
    const handleClick = vi.fn();
    
    render(
      <EmptyState
        title="No data"
        action={{ label: 'Create new', onClick: handleClick }}
      />
    );
    
    const button = screen.getByRole('button', { name: /create new/i });
    expect(button).toBeInTheDocument();
  });

  it('should call action onClick when button is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(
      <EmptyState
        title="No data"
        action={{ label: 'Add item', onClick: handleClick }}
      />
    );
    
    const button = screen.getByRole('button', { name: /add item/i });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<EmptyState title="No data" size="sm" />);
      
      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('should render medium size', () => {
      render(<EmptyState title="No data" size="md" />);
      
      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('should render large size', () => {
      render(<EmptyState title="No data" size="lg" />);
      
      expect(screen.getByText('No data')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper role and aria-label', () => {
      render(<EmptyState title="No results" />);
      
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'No results');
    });
  });
});

describe('EmptySearchResults', () => {
  it('should render with search term', () => {
    render(<EmptySearchResults searchTerm="test query" />);
    
    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText(/no results found for "test query"/i)).toBeInTheDocument();
  });

  it('should render clear button when onClear is provided', () => {
    const handleClear = vi.fn();
    
    render(<EmptySearchResults searchTerm="test" onClear={handleClear} />);
    
    const button = screen.getByRole('button', { name: /clear search/i });
    expect(button).toBeInTheDocument();
  });

  it('should call onClear when clear button is clicked', async () => {
    const user = userEvent.setup();
    const handleClear = vi.fn();
    
    render(<EmptySearchResults searchTerm="test" onClear={handleClear} />);
    
    const button = screen.getByRole('button', { name: /clear search/i });
    await user.click(button);
    
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it('should not render button when onClear is not provided', () => {
    render(<EmptySearchResults searchTerm="test" />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('EmptyErrorState', () => {
  it('should render with default title and description', () => {
    render(<EmptyErrorState />);
    
    expect(screen.getByText('Unable to load data')).toBeInTheDocument();
    expect(screen.getByText(/an error occurred while loading the data/i)).toBeInTheDocument();
  });

  it('should render with custom title and description', () => {
    render(
      <EmptyErrorState
        title="Connection failed"
        description="Unable to connect to the server."
      />
    );
    
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.getByText('Unable to connect to the server.')).toBeInTheDocument();
  });

  it('should render retry button when onRetry is provided', () => {
    const handleRetry = vi.fn();
    
    render(<EmptyErrorState onRetry={handleRetry} />);
    
    const button = screen.getByRole('button', { name: /retry/i });
    expect(button).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();
    
    render(<EmptyErrorState onRetry={handleRetry} />);
    
    const button = screen.getByRole('button', { name: /retry/i });
    await user.click(button);
    
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyDataState', () => {
  it('should render with default title and description', () => {
    render(<EmptyDataState />);
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(screen.getByText(/there is no data to display/i)).toBeInTheDocument();
  });

  it('should render with custom title and description', () => {
    render(
      <EmptyDataState
        title="No components"
        description="No components have been configured yet."
      />
    );
    
    expect(screen.getByText('No components')).toBeInTheDocument();
    expect(screen.getByText('No components have been configured yet.')).toBeInTheDocument();
  });

  it('should render create button when onCreate is provided', () => {
    const handleCreate = vi.fn();
    
    render(<EmptyDataState onCreate={handleCreate} />);
    
    const button = screen.getByRole('button', { name: /create new/i });
    expect(button).toBeInTheDocument();
  });

  it('should render custom create label', () => {
    const handleCreate = vi.fn();
    
    render(<EmptyDataState onCreate={handleCreate} createLabel="Add component" />);
    
    const button = screen.getByRole('button', { name: /add component/i });
    expect(button).toBeInTheDocument();
  });

  it('should call onCreate when create button is clicked', async () => {
    const user = userEvent.setup();
    const handleCreate = vi.fn();
    
    render(<EmptyDataState onCreate={handleCreate} />);
    
    const button = screen.getByRole('button', { name: /create new/i });
    await user.click(button);
    
    expect(handleCreate).toHaveBeenCalledTimes(1);
  });
});
