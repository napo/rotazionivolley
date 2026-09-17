import { useRef, useState } from 'react';
import type { FormationConfig, Point, SetterPosition } from '../configs/schema';
import type { Team } from '../state/AppStateContext';
import { RotationPanel } from '../controls/RotationPanel';
import { PhasePanel } from '../controls/PhasePanel';
import { CourtStage } from '../court/CourtStage';
import { COURT_RECT } from '../court/courtGeometry';
import { getBackRowMiddleId } from '../state/selectors';
import { useI18n } from '../i18n/I18nContext';
import { downloadConfig, validateDraft } from './exportConfig';
import './editor.css';

const COURT_CENTER: Point = {
  x: COURT_RECT.x + COURT_RECT.width / 2,
  y: COURT_RECT.y + COURT_RECT.height / 2,
};

interface ConfigEditorProps {
  availableConfigs: FormationConfig[];
  onApply: (config: FormationConfig) => void;
  onClose: () => void;
}

function cloneAsNewConfig(source: FormationConfig): FormationConfig {
  const clone = structuredClone(source) as FormationConfig;
  clone.id = `${source.id}-copia`;
  clone.name = `${source.name} (copia)`;
  return clone;
}

export function ConfigEditor({ availableConfigs, onApply, onClose }: ConfigEditorProps) {
  const { t } = useI18n();
  const [baseConfigId, setBaseConfigId] = useState(availableConfigs[0]?.id ?? '');
  const [draft, setDraft] = useState<FormationConfig | null>(null);
  const [team, setTeam] = useState<Team>('serve');
  const [phaseKey, setPhaseKey] = useState('base');
  const [setterPosition, setSetterPosition] = useState<SetterPosition>(2);
  const [errors, setErrors] = useState<string[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function startFromExisting() {
    const source = availableConfigs.find((c) => c.id === baseConfigId);
    if (!source) return;
    setDraft(cloneAsNewConfig(source));
    setTeam('serve');
    setPhaseKey('base');
    setSetterPosition(2);
    setErrors([]);
  }

  async function handleImportFile(file: File) {
    setImportError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = validateDraft(parsed);
      if (!result.success) {
        setImportError(result.error.issues.map((i) => i.message).join('; '));
        return;
      }
      setDraft(result.data);
      setTeam('serve');
      setPhaseKey('base');
      setSetterPosition(2);
      setErrors([]);
    } catch {
      setImportError(t('editor.importError.invalidJson'));
    }
  }

  function updatePlayerPosition(playerId: string, point: Point) {
    if (!draft) return;
    setDraft({
      ...draft,
      positions: {
        ...draft.positions,
        [phaseKey]: {
          ...draft.positions[phaseKey],
          [String(setterPosition)]: {
            ...draft.positions[phaseKey][String(setterPosition)],
            [playerId]: point,
          },
        },
      },
    });
  }

  function removePlayerPosition(playerId: string) {
    if (!draft) return;
    const cell = { ...(draft.positions[phaseKey]?.[String(setterPosition)] ?? {}) };
    delete cell[playerId];
    setDraft({
      ...draft,
      positions: {
        ...draft.positions,
        [phaseKey]: { ...draft.positions[phaseKey], [String(setterPosition)]: cell },
      },
    });
  }

  function handleValidateAndRun(action: (config: FormationConfig) => void) {
    if (!draft) return;
    const result = validateDraft(draft);
    if (!result.success) {
      setErrors(result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
      return;
    }
    setErrors([]);
    action(result.data);
  }

  const currentCellPositions = draft?.positions[phaseKey]?.[String(setterPosition)] ?? {};

  return (
    <div className="config-editor">
      <div className="config-editor__header">
        <button type="button" className="config-editor__back" onClick={onClose}>
          {t('editor.back')}
        </button>
        <h2>{t('editor.title')}</h2>
      </div>

      {!draft ? (
        <div className="config-editor__start">
          <label>
            {t('editor.baseOn')}
            <select value={baseConfigId} onChange={(e) => setBaseConfigId(e.target.value)}>
              {availableConfigs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={startFromExisting} disabled={!baseConfigId}>
            {t('editor.start')}
          </button>

          <p className="config-editor__or">{t('editor.or')}</p>

          <label className="config-editor__import">
            {t('editor.import')}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportFile(file);
                e.target.value = '';
              }}
            />
          </label>
          {importError && (
            <p role="alert" className="config-editor__error">
              {importError}
            </p>
          )}
        </div>
      ) : (
        <div className="config-editor__workspace">
          <div className="config-editor__court">
            <CourtStage
              players={[...draft.players, ...draft.liberos.filter((l) => currentCellPositions[l.id])]}
              positions={currentCellPositions}
              durationMs={0}
              editable
              onPlayerDrag={updatePlayerPosition}
              ariaLabel={`${t('editor.title')}: ${phaseKey}, P${setterPosition}`}
            />
          </div>

          <div className="config-editor__side">
            <fieldset className="config-editor__meta">
              <legend>{t('editor.meta.title')}</legend>
              <label>
                {t('editor.meta.id')}
                <input value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
              </label>
              <label>
                {t('editor.meta.name')}
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </label>
              <label>
                {t('editor.meta.description')}
                <textarea
                  value={draft.description ?? ''}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </label>
            </fieldset>

            <p className="config-editor__hint">{t('editor.hint')}</p>

            <RotationPanel
              setterPosition={setterPosition}
              team={team}
              onSelect={(pos, newTeam) => {
                setSetterPosition(pos);
                setTeam(newTeam);
                setPhaseKey('base');
              }}
            />
            <PhasePanel config={draft} team={team} phaseKey={phaseKey} onSelect={setPhaseKey} />

            {draft.liberos.length > 0 && (
              <fieldset className="config-editor__liberos">
                <legend>{t('editor.libero.title')}</legend>
                {draft.liberos.map((libero) => {
                  const present = Boolean(currentCellPositions[libero.id]);
                  const backRowMiddleId = getBackRowMiddleId(draft, setterPosition);
                  const suggestedStart = (backRowMiddleId && currentCellPositions[backRowMiddleId]) || COURT_CENTER;
                  return (
                    <button
                      key={libero.id}
                      type="button"
                      className={`config-editor__libero-btn${present ? ' is-present' : ''}`}
                      onClick={() =>
                        present ? removePlayerPosition(libero.id) : updatePlayerPosition(libero.id, suggestedStart)
                      }
                    >
                      {t(present ? 'editor.libero.remove' : 'editor.libero.add', { label: libero.shortLabel })}
                    </button>
                  );
                })}
              </fieldset>
            )}

            <div className="config-editor__actions">
              <button type="button" onClick={() => handleValidateAndRun(onApply)}>
                {t('editor.action.apply')}
              </button>
              <button type="button" onClick={() => handleValidateAndRun(downloadConfig)}>
                {t('editor.action.download')}
              </button>
              <button type="button" onClick={() => setDraft(null)}>
                {t('editor.action.restart')}
              </button>
            </div>

            {errors.length > 0 && (
              <ul className="config-editor__error" role="alert">
                {errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
