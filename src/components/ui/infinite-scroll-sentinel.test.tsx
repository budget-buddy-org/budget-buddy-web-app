import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InfiniteScrollSentinel } from './infinite-scroll-sentinel';

describe('InfiniteScrollSentinel', () => {
  it('renders Load more button and fires onLoadMore on click when hasNextPage', () => {
    const onLoadMore = vi.fn();
    render(
      <InfiniteScrollSentinel hasNextPage isFetchingNextPage={false} onLoadMore={onLoadMore} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /load more/i }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('disables the button while a fetch is in flight', () => {
    render(<InfiniteScrollSentinel hasNextPage isFetchingNextPage onLoadMore={vi.fn()} />);
    expect(screen.getByRole('button', { name: /load more/i })).toBeDisabled();
  });

  it('renders end-of-list message when no next page', () => {
    render(
      <InfiniteScrollSentinel
        hasNextPage={false}
        isFetchingNextPage={false}
        onLoadMore={vi.fn()}
      />,
    );
    expect(screen.getByText(/end of list/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
  });
});
