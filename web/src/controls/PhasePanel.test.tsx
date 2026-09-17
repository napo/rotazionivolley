import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import { PhasePanel } from './PhasePanel';
import { defaultConfig } from '../configs';

describe('PhasePanel', () => {
  it('renders only the phases available for the serving team', () => {
    renderWithProviders(<PhasePanel config={defaultConfig} team="serve" phaseKey="base" onSelect={vi.fn()} />);
    expect(screen.getByText('Base')).toBeInTheDocument();
    expect(screen.getByText('Servizio')).toBeInTheDocument();
    expect(screen.getByText('Cambio')).toBeInTheDocument();
    expect(screen.queryByText('Ricezione')).not.toBeInTheDocument();
    expect(screen.queryByText('Alzata')).not.toBeInTheDocument();
  });

  it('renders only the phases available for the receiving team', () => {
    renderWithProviders(<PhasePanel config={defaultConfig} team="receive" phaseKey="base" onSelect={vi.fn()} />);
    expect(screen.getByText('Base')).toBeInTheDocument();
    expect(screen.getByText('Ricezione')).toBeInTheDocument();
    expect(screen.getByText('Alzata')).toBeInTheDocument();
    expect(screen.getByText('Attacco')).toBeInTheDocument();
    expect(screen.getByText('Cambio')).toBeInTheDocument();
    expect(screen.queryByText('Servizio')).not.toBeInTheDocument();
  });

  it('calls onSelect with the clicked phase key', async () => {
    const onSelect = vi.fn();
    renderWithProviders(<PhasePanel config={defaultConfig} team="receive" phaseKey="base" onSelect={onSelect} />);
    await userEvent.click(screen.getByText('Attacco'));
    expect(onSelect).toHaveBeenCalledWith('receiveHit');
  });
});
