import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './pagination';

describe('Pagination', () => {
  const onPageChange = vi.fn();

  it('renders nothing when there is only one page', () => {
    const { container } = render(
      <Pagination page={0} total={10} size={20} onPageChange={onPageChange} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when total is equal to size', () => {
    const { container } = render(
      <Pagination page={0} total={20} size={20} onPageChange={onPageChange} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders pagination when there are multiple pages', () => {
    render(<Pagination page={0} total={21} size={20} onPageChange={onPageChange} />);
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    expect(screen.getByText(/(21 total items)/)).toBeInTheDocument();
  });

  it('renders pagination when on a second page', () => {
    render(<Pagination page={1} total={21} size={20} onPageChange={onPageChange} />);
    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();
  });
});
