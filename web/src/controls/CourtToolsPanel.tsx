import type { ReactNode } from 'react';
import { useI18n } from '../i18n/I18nContext';
import './courtTools.css';

export type CourtToolKey = 'faults' | 'zones';

export interface CourtTool {
  key: CourtToolKey;
  label: string;
  /** Short warning shown on the tab (e.g. a fault count) and announced to screen readers. */
  alert?: { badge: string; text: string };
  content: ReactNode;
}

interface CourtToolsPanelProps {
  /** Only the tools that apply to the current situation; the panel is not rendered when empty. */
  tools: CourtTool[];
  /** The open tool, or null when all are closed. */
  activeKey: CourtToolKey | null;
  onSelect: (key: CourtToolKey | null) => void;
}

/**
 * One panel under the court for the analysis tools (positional faults,
 * reception responsibilities): a tab per tool, sharing the space below.
 * Opening a tab also draws that tool on the court, so only one drawing is
 * ever on screen; clicking the open tab again closes it. A tool's alert
 * (a fault) shows on its tab even while closed, so it's never missed.
 */
export function CourtToolsPanel({ tools, activeKey, onSelect }: CourtToolsPanelProps) {
  const { t } = useI18n();
  if (tools.length === 0) return null;
  const active = tools.find((tool) => tool.key === activeKey);

  return (
    <section className="panel court-tools" aria-label={t('tools.ariaLabel')} data-tutorial="court-tools">
      <div className="court-tools__tabs" role="tablist" aria-label={t('tools.ariaLabel')}>
        {tools.map((tool) => {
          const selected = tool.key === activeKey;
          return (
            <button
              key={tool.key}
              type="button"
              role="tab"
              id={`court-tool-tab-${tool.key}`}
              aria-selected={selected}
              aria-controls={selected ? `court-tool-panel-${tool.key}` : undefined}
              className="court-tools__tab"
              onClick={() => onSelect(selected ? null : tool.key)}
            >
              {tool.label}
              {tool.alert && (
                <span className="court-tools__badge" aria-hidden="true">
                  ⚠ {tool.alert.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tools.map(
        (tool) =>
          tool.alert &&
          tool.key !== activeKey && (
            <p key={tool.key} role="alert" className="court-tools__sr-only">
              {tool.alert.text}
            </p>
          ),
      )}

      {active ? (
        <div
          role="tabpanel"
          id={`court-tool-panel-${active.key}`}
          aria-labelledby={`court-tool-tab-${active.key}`}
          className="court-tools__body"
        >
          {active.content}
        </div>
      ) : (
        <p className="court-tools__hint">{t('tools.hint')}</p>
      )}
    </section>
  );
}
