import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JsonInspector } from '@/components/common/JsonInspector';

describe('JsonInspector', () => {
  const sampleData = {
    name: 'Test Component',
    status: 'active',
    count: 42,
    enabled: true,
    metadata: {
      version: '1.0.0',
      tags: ['robot', 'sensor'],
    },
    nullValue: null,
  };

  describe('Rendering', () => {
    it('should render JSON data with syntax highlighting', () => {
      render(<JsonInspector data={sampleData} />);
      
      // Check for object keys
      expect(screen.getByText('"name"')).toBeInTheDocument();
      expect(screen.getByText('"status"')).toBeInTheDocument();
      expect(screen.getByText('"count"')).toBeInTheDocument();
    });

    it('should display data types correctly', () => {
      render(<JsonInspector data={sampleData} />);
      
      // String values should be in quotes
      expect(screen.getByText('"Test Component"')).toBeInTheDocument();
      
      // Numbers should be displayed without quotes
      expect(screen.getByText('42')).toBeInTheDocument();
      
      // Booleans should be displayed
      expect(screen.getByText('true')).toBeInTheDocument();
      
      // Null should be displayed
      expect(screen.getByText('null')).toBeInTheDocument();
    });

    it('should display byte size information', () => {
      render(<JsonInspector data={sampleData} />);
      
      // Should show size information
      expect(screen.getByText(/Size:/)).toBeInTheDocument();
      expect(screen.getByText(/bytes|KB|MB/)).toBeInTheDocument();
    });

    it('should display data type information', () => {
      render(<JsonInspector data={sampleData} />);
      
      expect(screen.getByText(/Type:/)).toBeInTheDocument();
      expect(screen.getByText('object')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('should expand nested objects when clicked', async () => {
      const user = userEvent.setup();
      render(<JsonInspector data={sampleData} maxExpandDepth={0} />);
      
      // Initially, nested content should not be visible
      expect(screen.queryByText('"version"')).not.toBeInTheDocument();
      
      // Find and click the metadata object toggle
      const metadataToggle = screen.getByRole('button', { name: /expand object/i });
      await user.click(metadataToggle);
      
      // After expanding, nested content should be visible
      await waitFor(() => {
        expect(screen.getByText('"metadata"')).toBeInTheDocument();
      });
    });

    it('should expand all nodes when Expand All is clicked', async () => {
      const user = userEvent.setup();
      render(<JsonInspector data={sampleData} maxExpandDepth={0} />);
      
      // Initially, nested content should not be visible
      expect(screen.queryByText('"version"')).not.toBeInTheDocument();
      
      // Click Expand All button
      const expandAllButton = screen.getByRole('button', { name: /expand all/i });
      await user.click(expandAllButton);
      
      // All nested content should now be visible
      await waitFor(() => {
        expect(screen.getByText('"version"')).toBeInTheDocument();
        expect(screen.getByText('"tags"')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should display search input when searchable is true', () => {
      render(<JsonInspector data={sampleData} searchable={true} />);
      
      expect(screen.getByPlaceholderText(/search in json/i)).toBeInTheDocument();
    });

    it('should not display search input when searchable is false', () => {
      render(<JsonInspector data={sampleData} searchable={false} />);
      
      expect(screen.queryByPlaceholderText(/search in json/i)).not.toBeInTheDocument();
    });

    it('should highlight matching text when searching', async () => {
      const user = userEvent.setup();
      render(<JsonInspector data={sampleData} maxExpandDepth={2} />);
      
      const searchInput = screen.getByPlaceholderText(/search in json/i);
      await user.type(searchInput, 'Test');
      
      // Should highlight the matching text
      await waitFor(() => {
        const marks = screen.getAllByText('Test Component');
        expect(marks.some(el => el.tagName === 'MARK')).toBe(true);
      });
    });

    it('should highlight matching keys when searching', async () => {
      const user = userEvent.setup();
      render(<JsonInspector data={sampleData} maxExpandDepth={2} />);
      
      const searchInput = screen.getByPlaceholderText(/search in json/i);
      await user.type(searchInput, 'version');
      
      // Should highlight the matching key
      await waitFor(() => {
        const marks = screen.getAllByText('"version"');
        expect(marks.some(el => el.tagName === 'MARK')).toBe(true);
      });
    });
  });

  describe('Copy to Clipboard', () => {
    it('should display copy button when copyable is true', () => {
      render(<JsonInspector data={sampleData} copyable={true} />);
      
      expect(screen.getByRole('button', { name: /copy json/i })).toBeInTheDocument();
    });

    it('should not display copy button when copyable is false', () => {
      render(<JsonInspector data={sampleData} copyable={false} />);
      
      expect(screen.queryByRole('button', { name: /copy json/i })).not.toBeInTheDocument();
    });

    it('should copy JSON to clipboard when copy button is clicked', async () => {
      const user = userEvent.setup();
      
      // Mock clipboard API
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: writeTextMock,
        },
        writable: true,
        configurable: true,
      });
      
      render(<JsonInspector data={sampleData} copyable={true} />);
      
      const copyButton = screen.getByRole('button', { name: /copy json/i });
      await user.click(copyButton);
      
      // Should call clipboard API with formatted JSON
      expect(writeTextMock).toHaveBeenCalledWith(JSON.stringify(sampleData, null, 2));
      
      // Should show "Copied" feedback
      await waitFor(() => {
        expect(screen.getByText('Copied')).toBeInTheDocument();
      });
    });
  });

  describe('Array Handling', () => {
    it('should display arrays with item count', () => {
      const arrayData = { items: [1, 2, 3, 4, 5] };
      render(<JsonInspector data={arrayData} maxExpandDepth={1} />);
      
      expect(screen.getByText(/Array\[5\]/)).toBeInTheDocument();
    });

    it('should display array items with indices', () => {
      const arrayData = { items: ['first', 'second', 'third'] };
      render(<JsonInspector data={arrayData} maxExpandDepth={2} />);
      
      expect(screen.getByText('0:')).toBeInTheDocument();
      expect(screen.getByText('1:')).toBeInTheDocument();
      expect(screen.getByText('2:')).toBeInTheDocument();
    });

    it('should handle empty arrays', () => {
      const emptyArrayData = { items: [] };
      render(<JsonInspector data={emptyArrayData} maxExpandDepth={1} />);
      
      expect(screen.getByText('[]')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty objects', () => {
      const emptyObject = {};
      render(<JsonInspector data={emptyObject} />);
      
      expect(screen.getByText('{}')).toBeInTheDocument();
    });

    it('should handle primitive values', () => {
      render(<JsonInspector data="simple string" />);
      expect(screen.getByText('"simple string"')).toBeInTheDocument();
    });

    it('should handle null values', () => {
      render(<JsonInspector data={null} />);
      // Check for null in the tree area specifically
      const treeArea = screen.getByRole('tree');
      expect(treeArea).toHaveTextContent('null');
    });

    it('should handle deeply nested structures', () => {
      const deepData = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };
      
      render(<JsonInspector data={deepData} maxExpandDepth={4} />);
      expect(screen.getByText('"deep"')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<JsonInspector data={sampleData} />);
      
      expect(screen.getByRole('region', { name: /json inspector/i })).toBeInTheDocument();
      expect(screen.getByRole('tree', { name: /json data tree/i })).toBeInTheDocument();
    });

    it('should have accessible expand/collapse buttons', () => {
      render(<JsonInspector data={sampleData} maxExpandDepth={0} />);
      
      // Get buttons that have aria-expanded attribute (the expand/collapse buttons for objects/arrays)
      const expandButtons = screen.getAllByRole('button').filter(button => 
        button.hasAttribute('aria-expanded')
      );
      
      expect(expandButtons.length).toBeGreaterThan(0);
      
      expandButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-expanded');
      });
    });

    it('should have accessible search input', () => {
      render(<JsonInspector data={sampleData} searchable={true} />);
      
      const searchInput = screen.getByRole('textbox', { name: /search within json/i });
      expect(searchInput).toBeInTheDocument();
    });
  });
});
