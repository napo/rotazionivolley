import { useRef, useState } from 'react';
import type { FormationConfig } from './configs/schema';
import { CourtStage, type CourtStageApi } from './court/CourtStage';
import { ANIMATION_DURATION_MS } from './court/courtGeometry';
import { computeBenchDisplay } from './court/benchDisplay';
import { RotationPanel } from './controls/RotationPanel';
import { PhasePanel } from './controls/PhasePanel';
import { ConfigPicker } from './controls/ConfigPicker';
import { HeaderDropdown } from './controls/HeaderDropdown';
import { Tutorial } from './tutorial/Tutorial';
import { ExportMenu } from './export/ExportMenu';
import { ConfigEditor } from './editor/ConfigEditor';
import { CommentPanel } from './comments/CommentPanel';
import { InfoPanel } from './info/InfoPanel';
import { LanguageSwitcher } from './i18n/LanguageSwitcher';
import { useI18n } from './i18n/I18nContext';
import { builtInConfigs } from './configs';
import { getComment, getPositions, resolveActiveLiberoSwap } from './state/selectors';
import { useAppState } from './state/AppStateContext';
import './App.css';

function App() {
  const { state, dispatch, config, customConfigs, addCustomConfig, setComment } = useAppState();
  const { t } = useI18n();
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const courtStageApiRef = useRef<CourtStageApi | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [view, setView] = useState<'viewer' | 'editor'>('viewer');
  const [editTarget, setEditTarget] = useState<FormationConfig | undefined>(undefined);
  // A custom entry overrides a built-in with the same id (e.g. a built-in
  // config with session-only comments layered on top — see setComment).
  const allConfigs = [...builtInConfigs.filter((c) => !customConfigs.some((cc) => cc.id === c.id)), ...customConfigs];

  if (view === 'editor') {
    return (
      <ConfigEditor
        availableConfigs={allConfigs}
        initialConfig={editTarget}
        onClose={() => setView('viewer')}
        onApply={(newConfig) => {
          addCustomConfig(newConfig);
          dispatch({ type: 'SELECT_CONFIG', configId: newConfig.id });
          setView('viewer');
        }}
      />
    );
  }

  // Everyone is always shown — on court, or benched (left of the court) if
  // a libero is swapped in for them — so the libero's entrance/exit reads
  // as a move rather than a silent swap. See computeBenchDisplay.
  const cellPositions = getPositions(config, state.phaseKey, state.setterPosition);
  const activeSwap = resolveActiveLiberoSwap(config, state.team, state.setterPosition, state.activeLiberoId);
  const { players, positions } = computeBenchDisplay(config, cellPositions, activeSwap);

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-titles">
          <h1>{t('app.title')}</h1>
          <ConfigPicker
            configs={allConfigs}
            configId={state.configId}
            onSelect={(configId) => dispatch({ type: 'SELECT_CONFIG', configId })}
            onEdit={(config) => {
              setEditTarget(config);
              setView('editor');
            }}
            onAddNew={() => {
              setEditTarget(undefined);
              setView('editor');
            }}
          />
        </div>
        <div className="app__header-actions">
          <LanguageSwitcher />
          <button type="button" className="app__header-btn" onClick={() => setTutorialOpen(true)}>
            {t('app.tutorialButton')}
          </button>
          <HeaderDropdown label={t('export.title')}>
            <ExportMenu
              config={config}
              team={state.team}
              phaseKey={state.phaseKey}
              setterPosition={state.setterPosition}
              activeLiberoId={state.activeLiberoId}
              embedded
            />
          </HeaderDropdown>
          <button type="button" className="app__header-btn" onClick={() => setInfoOpen(true)}>
            {t('app.infoButton')}
          </button>
        </div>
      </header>

      <main className="app__layout">
        <div className="app__court" data-tutorial="court">
          <CourtStage
            players={players}
            positions={positions}
            durationMs={ANIMATION_DURATION_MS}
            highlightedPlayerId={state.highlightedPlayerId}
            onTogglePlayer={(playerId) => dispatch({ type: 'TOGGLE_HIGHLIGHT', playerId })}
            ariaLabel={`${config.name}, ${config.phases[state.phaseKey]?.label ?? state.phaseKey}, P${state.setterPosition}`}
            apiRef={courtStageApiRef}
          />
          <CommentPanel
            value={getComment(config, state.phaseKey, state.setterPosition)}
            onChange={(text) => setComment(state.phaseKey, state.setterPosition, text)}
          />
        </div>

        <div className="app__controls">
          <RotationPanel
            setterPosition={state.setterPosition}
            team={state.team}
            onSelect={(setterPosition, team) => dispatch({ type: 'SELECT_ROTATION', setterPosition, team })}
          />
          <PhasePanel
            config={config}
            team={state.team}
            phaseKey={state.phaseKey}
            onSelect={(phaseKey) => dispatch({ type: 'SELECT_PHASE', phaseKey })}
          />
        </div>
      </main>

      {tutorialOpen && (
        <Tutorial
          onClose={() => setTutorialOpen(false)}
          getSamplePlayerRect={() =>
            players[0] ? (courtStageApiRef.current?.getPlayerScreenRect(players[0].id) ?? null) : null
          }
        />
      )}
      {infoOpen && <InfoPanel onClose={() => setInfoOpen(false)} />}
    </div>
  );
}

export default App;
