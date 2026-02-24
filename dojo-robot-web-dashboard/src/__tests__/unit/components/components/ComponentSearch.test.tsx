import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentSearch } from '../../../../components/components/ComponentSearch';

describe('ComponentSearch', () => {
  it('renders search input with placeholder', () => {
    const onChange = vi.fn();
    render(
      <ComponentSearch
        value=""
        onChange={onChange}
        placeholder="Search components..."
      />
    );

    const input = screen.getByPlaceholderText('Search components...');
    expect(input).toBeInTheDocument();
  });

  it('displays current value', () => {
    const onChange = vi.fn();
    render(<ComponentSearch value="test" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test');
  });

  it('debounces onChange callback by 300ms', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<ComponentSearch value="" onChange={onChange} debounceMs={300} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test');

    // Should not call onChange immediately
    expect(onChange).not.toHaveBeenCalled();

    // Wait for debounce
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('test');
    }, { timeout: 500 });
  });

  it('shows clear button when input has value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<ComponentSearch value="" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test');

    const clearButton = await screen.findByLabelText('Clear search');
    expect(clearButton).toBeInTheDocument();
  });

  it('does not show clear button when input is empty', () => {
    const onChange = vi.fn();
    render(<ComponentSearch value="" onChange={onChange} />);

    const clearButton = screen.queryByLabelText('Clear search');
    expect(clearButton).not.toBeInTheDocument();
  });

  it('clears input when clear button is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<ComponentSearch value="test" onChange={onChange} />);

    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('');
    
    // Should call onChange immediately when clearing
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('displays result count when provided', () => {
    const onChange = vi.fn();
    render(
      <ComponentSearch
        value="test"
        onChange={onChange}
        resultCount={5}
        totalCount={10}
      />
    );

    expect(screen.getByText('Showing 5 of 10 components')).toBeInTheDocument();
  });

  it('does not display result count when search is empty', () => {
    const onChange = vi.fn();
    render(
      <ComponentSearch
        value=""
        onChange={onChange}
        resultCount={10}
        totalCount={10}
      />
    );

    expect(
      screen.queryByText(/Showing .* of .* components/)
    ).not.toBeInTheDocument();
  });

  it('does not display result count when counts are not provided', () => {
    const onChange = vi.fn();
    render(<ComponentSearch value="test" onChange={onChange} />);

    expect(
      screen.queryByText(/Showing .* of .* components/)
    ).not.toBeInTheDocument();
  });

  it('syncs local value with prop value', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ComponentSearch value="initial" onChange={onChange} />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('initial');

    rerender(<ComponentSearch value="updated" onChange={onChange} />);
    expect(input).toHaveValue('updated');
  });

  it('uses custom debounce delay', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ComponentSearch value="" onChange={onChange} debounceMs={500} />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'test');

    // Should not call onChange immediately
    expect(onChange).not.toHaveBeenCalled();

    // Wait for custom debounce delay
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('test');
    }, { timeout: 700 });
  });

  it('cancels previous debounce timer on new input', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<ComponentSearch value="" onChange={onChange} debounceMs={300} />);

    const input = screen.getByRole('textbox');
    
    // Type multiple characters quickly
    await user.type(input, 'test');
    
    // Wait for debounce - should only be called once with final value
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('test');
    }, { timeout: 500 });
  });

  it('has accessible labels', () => {
    const onChange = vi.fn();
    render(
      <ComponentSearch
        value="test"
        onChange={onChange}
        resultCount={5}
        totalCount={10}
      />
    );

    const input = screen.getByLabelText('Search components');
    expect(input).toBeInTheDocument();

    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toBeInTheDocument();

    const resultCount = screen.getByRole('status');
    expect(resultCount).toHaveTextContent('Showing 5 of 10 components');
  });
});
