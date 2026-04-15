import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AmountInput } from './amount-input';

describe('AmountInput', () => {
  it('formats initial value correctly', () => {
    render(<AmountInput value="12.34" onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('12.34');
  });

  it('handles "1" -> "0.01" shift', async () => {
    const onChange = vi.fn();
    render(<AmountInput value="" onChange={onChange} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '1');
    expect(onChange).toHaveBeenLastCalledWith('0.01');
  });

  it('handles "10" -> "0.10" shift', async () => {
    const onChange = vi.fn();
    render(<AmountInput value="0.01" onChange={onChange} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '0');
    expect(onChange).toHaveBeenLastCalledWith('0.10');
  });

  it('handles "100" -> "1.00" shift', async () => {
    const onChange = vi.fn();
    render(<AmountInput value="0.10" onChange={onChange} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '0');
    expect(onChange).toHaveBeenLastCalledWith('1.00');
  });

  it('handles backspace correctly', async () => {
    const onChange = vi.fn();
    render(<AmountInput value="1.00" onChange={onChange} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '{backspace}');
    expect(onChange).toHaveBeenLastCalledWith('0.10');
  });

  it('clears value when all digits are removed', async () => {
    const onChange = vi.fn();
    render(<AmountInput value="0.01" onChange={onChange} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '{backspace}');
    expect(onChange).toHaveBeenLastCalledWith('');
  });
});
