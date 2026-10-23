import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PlayerDef } from '../configs/schema';
import type { PositionRelation, Zone } from '../state/positionalFaults';
import { renderWithProviders } from '../testUtils';
import { PositionalFaultPanel } from './PositionalFaultPanel';

const players: PlayerDef[] = [
  { id: 'P', label: 'Palleggiatore', shortLabel: 'P', role: 'setter' },
  { id: 'O', label: 'Opposto', shortLabel: 'O', role: 'opposite' },
];
const zones: Record<string, Zone> = { P: 2, O: 1 };
const fault: PositionRelation = { kind: 'frontBack', firstId: 'P', secondId: 'O', firstZone: 2, secondZone: 1, ok: false };

function renderPanel(props: Partial<Parameters<typeof PositionalFaultPanel>[0]> = {}) {
  const onSelectPlayer = vi.fn();
  renderWithProviders(
    <PositionalFaultPanel
      onSelectPlayer={onSelectPlayer}
      players={players}
      zones={zones}
      relations={[fault]}
      selectedId={null}
      {...props}
    />,
  );
  return { onSelectPlayer };
}

describe('PositionalFaultPanel', () => {
  it('sums up the faults of the formation', () => {
    renderPanel();
    expect(screen.getByText('1 fallo di posizione')).toBeInTheDocument();
  });

  it('stays quiet when the formation has no fault', () => {
    renderPanel({ relations: [{ ...fault, ok: true }] });
    expect(screen.queryByText('1 fallo di posizione')).toBeNull();
    expect(screen.getByText('Nessun fallo di posizione in questa formazione.')).toBeInTheDocument();
  });

  it('switches between a single player and the whole formation', () => {
    const { onSelectPlayer } = renderPanel({ selectedId: 'P' });
    expect(screen.getByRole('button', { name: 'P' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Tutta la formazione' })).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Tutta la formazione' }));
    expect(onSelectPlayer).toHaveBeenLastCalledWith(null);
    fireEvent.click(screen.getByRole('button', { name: 'O' }));
    expect(onSelectPlayer).toHaveBeenLastCalledWith('O');
  });
});
