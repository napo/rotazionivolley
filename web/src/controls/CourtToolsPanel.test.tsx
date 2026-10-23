import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../testUtils';
import { CourtToolsPanel, type CourtTool } from './CourtToolsPanel';

const tools: CourtTool[] = [
  { key: 'faults', label: 'Falli di posizione', alert: { badge: '1', text: '1 fallo di posizione' }, content: <p>falli</p> },
  { key: 'zones', label: 'Competenze di ricezione', content: <p>zone</p> },
];

describe('CourtToolsPanel', () => {
  it('shows only the open tab, and a click on it closes it', () => {
    const onSelect = vi.fn();
    renderWithProviders(<CourtToolsPanel tools={tools} activeKey="zones" onSelect={onSelect} />);
    expect(screen.getByRole('tab', { name: 'Competenze di ricezione' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('zone');
    expect(screen.queryByText('falli')).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: 'Competenze di ricezione' }));
    expect(onSelect).toHaveBeenLastCalledWith(null);
    fireEvent.click(screen.getByRole('tab', { name: /Falli di posizione/ }));
    expect(onSelect).toHaveBeenLastCalledWith('faults');
  });

  it('announces a fault while its tab is closed', () => {
    renderWithProviders(<CourtToolsPanel tools={tools} activeKey={null} onSelect={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent('1 fallo di posizione');
    expect(screen.queryByRole('tabpanel')).toBeNull();
  });

  it('is not rendered when no tool applies', () => {
    renderWithProviders(<CourtToolsPanel tools={[]} activeKey={null} onSelect={() => {}} />);
    expect(screen.queryByRole('tablist')).toBeNull();
  });
});
