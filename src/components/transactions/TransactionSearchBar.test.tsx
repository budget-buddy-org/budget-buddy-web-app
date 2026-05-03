import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionSearchBar } from './TransactionSearchBar';

describe('TransactionSearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces query input and emits the latest value', () => {
    const onQueryChange = vi.fn();
    render(
      <TransactionSearchBar
        value=""
        onQueryChange={onQueryChange}
        onOpenFilters={() => {}}
        isFiltered={false}
      />,
    );

    const input = screen.getByLabelText(/search transactions/i);
    fireEvent.change(input, { target: { value: 'co' } });
    fireEvent.change(input, { target: { value: 'cof' } });
    fireEvent.change(input, { target: { value: 'coffee' } });

    expect(onQueryChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onQueryChange).toHaveBeenCalledWith('coffee');
  });

  it('emits undefined when input is cleared', () => {
    const onQueryChange = vi.fn();
    render(
      <TransactionSearchBar
        value="coffee"
        onQueryChange={onQueryChange}
        onOpenFilters={() => {}}
        isFiltered={false}
      />,
    );

    const input = screen.getByLabelText(/search transactions/i);
    fireEvent.change(input, { target: { value: '' } });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onQueryChange).toHaveBeenCalledWith(undefined);
  });

  it('calls onOpenFilters when filter button is clicked', () => {
    const onOpenFilters = vi.fn();
    render(
      <TransactionSearchBar
        value=""
        onQueryChange={() => {}}
        onOpenFilters={onOpenFilters}
        isFiltered={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /open filters/i }));
    expect(onOpenFilters).toHaveBeenCalled();
  });
});
