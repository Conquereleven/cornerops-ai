import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  test('disables empty submissions and sends a typed message', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <ChatInput value="" loading={false} onChange={onChange} onSubmit={onSubmit} />,
    );

    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
    await user.type(screen.getByLabelText('Mensaje'), 'Hola');
    expect(onChange).toHaveBeenCalled();

    rerender(
      <ChatInput value="Hola" loading={false} onChange={onChange} onSubmit={onSubmit} />,
    );
    await user.upload(
      screen.getByLabelText('Seleccionar archivo'),
      new File(['brief'], 'brief.pdf', { type: 'application/pdf' }),
    );
    expect(screen.getByText('brief.pdf')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(onSubmit).toHaveBeenCalledWith('brief.pdf');
  });
});
