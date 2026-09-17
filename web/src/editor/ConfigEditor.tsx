import { useRef, useState } from 'react';
import type { FormationConfig, Point, SetterPosition } from '../configs/schema';
import type { Team } from '../state/AppStateContext';
import { RotationPanel } from '../controls/RotationPanel';
import { PhasePanel } from '../controls/PhasePanel';
import { CourtStage } from '../court/CourtStage';
import { ANIMATION_DURATION_MS } from '../court/courtGeometry';
import { computeBenchDisplay } from '../court/benchDisplay';
import { getBackRowPlayerIds, getLiberoSwap, withLiberoSwap } from '../state/selectors';
import { useI18n } from '../i18n/I18nContext';
import { downloadConfig, validateDraft } from './exportConfig';
import './editor.css';

interface ConfigEditorProps {
  availableConfigs: FormationConfig[];
  /** When set, the editor opens straight into editing this config in place (same id — not a copy). */
  initialConfig?: FormationConfig;
  onApply: (config: FormationConfig) => void;
  onClose: () => void;
}

function cloneAsNewConfig(source: FormationConfig): FormationConfig {
  const clone = structuredClone(source) as FormationConfig;
  clone.name = `${source.name} (copia)`;
  clone.id = generateId(clone.name);
  return clone;
}

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'modulo';
}

/** A short, deterministic hash of `text` (djb2), base36-encoded — just enough to keep auto-generated ids apart. */
function shortHash(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 33) ^ text.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

/** Derives a stable id from a config's name — used instead of asking the user to pick one. */
function generateId(name: string): string {
  return `${slugify(name)}-${shortHash(name)}`;
}

export function ConfigEditor({ availableConfigs, initialConfig, onApply, onClose }: ConfigEditorProps) {
  const { t } = useI18n();
  // Editing an existing scheme in place must keep its id stable (so "Apply"
  // overwrites the same entry) — the id only follows the name automatically
  // for a brand new scheme, which the user never sees or picks themselves.
  const isEditingInPlace = initialConfig != null;
  const [baseConfigId, setBaseConfigId] = useState(availableConfigs[0]?.id ?? '');
  const [draft, setDraft] = useState<FormationConfig | null>(() =>
    initialConfig ? structuredClone(initialConfig) : null,
  );
  const [team, setTeam] = useState<Team>('serve');
  const [phaseKey, setPhaseKey] = useState('base');
  const [setterPosition, setSetterPosition] = useState<SetterPosition>(2);
  const [errors, setErrors] = useState<string[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [armedLiberoId, setArmedLiberoId] = useState<string | null>(null);
  // 0 while dragging (instant, so it doesn't fight the live drag motion),
  // bumped only for a libero swap so that move reads as the two players
  // trading places rather than teleporting.
  const [animMs, setAnimMs] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function startFromExisting() {
    const source = availableConfigs.find((c) => c.id === baseConfigId);
    if (!source) return;
    setDraft(cloneAsNewConfig(source));
    setTeam('serve');
    setPhaseKey('base');
    setSetterPosition(2);
    setArmedLiberoId(null);
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
      setArmedLiberoId(null);
      setErrors([]);
    } catch {
      setImportError(t('editor.importError.invalidJson'));
    }
  }

  function updatePlayerPosition(playerId: string, point: Point) {
    if (!draft) return;
    setAnimMs(0);
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

  /**
   * Routes a click on any court marker (real player or libero) through the
   * libero swap flow: click a benched libero to arm it, click it again (or
   * an on-court libero) to disarm/take it off, or — while a libero is armed
   * — click a back-row player to bring the libero on in their place (the
   * two swap positions; see selectors.withLiberoSwap). Only ever wired up
   * while on "base" — see isBase below: the swap is decided once there and
   * then locked for the rest of the rotation's sequence.
   */
  function handleEntityClick(id: string) {
    if (!draft) return;
    const isLibero = draft.liberos.some((l) => l.id === id);
    const currentSwap = getLiberoSwap(draft, team, setterPosition);

    if (isLibero) {
      if (currentSwap?.libero === id) {
        // On court already: swap in whichever other libero is armed, or take it off.
        const nextSwap = armedLiberoId && armedLiberoId !== id ? { libero: armedLiberoId, replaces: currentSwap.replaces } : undefined;
        setAnimMs(ANIMATION_DURATION_MS);
        setDraft(withLiberoSwap(draft, team, setterPosition, nextSwap));
        setArmedLiberoId(null);
        return;
      }
      setArmedLiberoId((prev) => (prev === id ? null : id));
      return;
    }

    if (!armedLiberoId) return;
    if (!getBackRowPlayerIds(draft, setterPosition).includes(id)) return;
    setAnimMs(ANIMATION_DURATION_MS);
    setDraft(withLiberoSwap(draft, team, setterPosition, { libero: armedLiberoId, replaces: id }));
    setArmedLiberoId(null);
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
  const liberoSwap = draft ? getLiberoSwap(draft, team, setterPosition) : undefined;
  const isBase = phaseKey === 'base';

  // Every player and libero is always shown: on court at their real spot, or
  // benched (left of the court) when not currently in play — see the
  // "editor.libero.hint" UI below for how a swap is made.
  const { players: displayPlayers, positions: displayPositions, benchedIds: nonDraggableIds } = draft
    ? computeBenchDisplay(draft, currentCellPositions, liberoSwap)
    : { players: [], positions: {} as Record<string, Point>, benchedIds: new Set<string>() };

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
            <label className="config-editor__name">
              {t('editor.meta.name')}
              <input
                value={draft.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setDraft(isEditingInPlace ? { ...draft, name } : { ...draft, name, id: generateId(name) });
                }}
              />
            </label>

            <div className="config-editor__canvas">
              <CourtStage
                players={displayPlayers}
                positions={displayPositions}
                durationMs={animMs}
                editable
                onPlayerDrag={updatePlayerPosition}
                onTogglePlayer={isBase ? handleEntityClick : undefined}
                nonDraggableIds={nonDraggableIds}
                highlightedPlayerId={armedLiberoId}
                ariaLabel={`${t('editor.title')}: ${phaseKey}, P${setterPosition}`}
              />
            </div>

            <label className="config-editor__description">
              {t('editor.meta.description')}
              <textarea
                value={draft.description ?? ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </label>

            {draft.liberos.length > 0 && (
              <div className="config-editor__libero-note">
                <h3>{t('editor.libero.title')}</h3>
                <p className="config-editor__hint">{isBase ? t('editor.libero.hint') : t('editor.libero.lockedHint')}</p>
              </div>
            )}
          </div>

          <div className="config-editor__side">
            <p className="config-editor__hint">{t('editor.hint')}</p>

            <RotationPanel
              setterPosition={setterPosition}
              team={team}
              onSelect={(pos, newTeam) => {
                setAnimMs(0);
                setArmedLiberoId(null);
                setSetterPosition(pos);
                setTeam(newTeam);
                setPhaseKey('base');
              }}
            />
            <PhasePanel
              config={draft}
              team={team}
              phaseKey={phaseKey}
              onSelect={(key) => {
                setAnimMs(0);
                setArmedLiberoId(null);
                setPhaseKey(key);
              }}
            />

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
