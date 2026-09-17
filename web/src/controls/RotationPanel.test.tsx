import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import { RotationPanel } from './RotationPanel';

describe('RotationPanel', () => {
  it('renders 12 rotation buttons (6 positions x serve/receive)', () => {
    renderWithProviders(<RotationPanel setterPosition={2} team="serve" onSelect={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(12);
  });

  it('marks the active position+team button', () => {
    renderWithProviders(<RotationPanel setterPosition={3} team="receive" onSelect={vi.fn()} />);
    const activeButtons = screen.getAllByRole('button').filter((btn) => btn.className.includes('is-active'));
    expect(activeButtons).toHaveLength(1);
    expect(activeButtons[0]).toHaveTextContent('P3');
  });

  it('calls onSelect with the clicked position and team', async () => {
    const onSelect = vi.fn();
    renderWithProviders(<RotationPanel setterPosition={2} team="serve" onSelect={onSelect} />);
    const receiveColumn = screen.getByLabelText('Rotazione').querySelector('[data-tutorial="rotation-receive"]')!;
    const p5Receive = Array.from(receiveColumn.querySelectorAll('button')).find((b) => b.textContent === 'P5')!;

    await userEvent.click(p5Receive);

    expect(onSelect).toHaveBeenCalledWith(5, 'receive');
  });
});
