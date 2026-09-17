import { useEffect, useRef, useState } from 'react';
import type { FormationConfig } from '../configs/schema';
import { useI18n } from '../i18n/I18nContext';
import './controls.css';

interface ConfigPickerProps {
  configs: FormationConfig[];
  configId: string;
  onSelect: (configId: string) => void;
  onEdit: (config: FormationConfig) => void;
  onAddNew: () => void;
}

export function ConfigPicker({ configs, configId, onSelect, onEdit, onAddNew }: ConfigPickerProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = configs.find((c) => c.id === configId) ?? configs[0];

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  if (!current) return null;

  return (
    <div className="schema-switcher" ref={rootRef}>
      <button
        type="button"
        className="schema-switcher__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {current.name}
        <span className="schema-switcher__caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <div className="schema-switcher__menu" role="menu">
          {configs.map((config) => (
            <div key={config.id} className="schema-switcher__row" role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={config.id === configId}
                className={`schema-switcher__option${config.id === configId ? ' is-active' : ''}`}
                onClick={() => {
                  onSelect(config.id);
                  setOpen(false);
                }}
              >
                {config.name}
              </button>
              <button
                type="button"
                className="schema-switcher__edit"
                aria-label={t('configPicker.edit', { name: config.name })}
                onClick={() => {
                  onEdit(config);
                  setOpen(false);
                }}
              >
                ✎
              </button>
            </div>
          ))}
          <button
            type="button"
            className="schema-switcher__add"
            onClick={() => {
              onAddNew();
              setOpen(false);
            }}
          >
            + {t('configPicker.addNew')}
          </button>
        </div>
      )}
    </div>
  );
}
