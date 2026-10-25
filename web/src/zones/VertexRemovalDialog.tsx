import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import './zones.css';

interface VertexRemovalDialogProps {
  /** False for a vertex that can't go (see canRemoveVertex): the dialog only explains why. */
  removable: boolean;
  /** `dontAskAgain`: the user ticked "don't ask again" (see zonePreferences). */
  onConfirm: (dontAskAgain: boolean) => void;
  onCancel: () => void;
}

/**
 * Asked on a double click/tap on a vertex of the competence map, over the
 * whole screen: remove it for good? With a "don't ask again" box — the
 * question comes back from the Info page.
 */
export function VertexRemovalDialog({ removable, onConfirm, onCancel }: VertexRemovalDialogProps) {
  const { t } = useI18n();
  const [dontAskAgain, setDontAskAgain] = useState(false);

  return (
    <div className="zones-dialog" role="presentation" onClick={onCancel}>
      <div
        className="zones-dialog__box"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="zones-dialog-title"
        aria-describedby="zones-dialog-text"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      >
        <h2 id="zones-dialog-title">{t('zones.removeVertex.title')}</h2>
        <p id="zones-dialog-text">{removable ? t('zones.removeVertex.text') : t('zones.removeVertex.fixed')}</p>
        {removable && (
          <label className="zones-dialog__check">
            <input type="checkbox" checked={dontAskAgain} onChange={(e) => setDontAskAgain(e.target.checked)} />
            {t('zones.removeVertex.dontAsk')}
          </label>
        )}
        <div className="zones-dialog__actions">
          {removable ? (
            <>
              <button type="button" className="zones-dialog__cancel" onClick={onCancel} autoFocus>
                {t('zones.removeVertex.cancel')}
              </button>
              <button type="button" className="zones-dialog__confirm" onClick={() => onConfirm(dontAskAgain)}>
                {t('zones.removeVertex.confirm')}
              </button>
            </>
          ) : (
            <button type="button" className="zones-dialog__cancel" onClick={onCancel} autoFocus>
              {t('zones.removeVertex.ok')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
