import { useState } from 'react';
import { CourtStage } from './court/CourtStage';
import { ANIMATION_DURATION_MS } from './court/courtGeometry';
import { RotationPanel } from './controls/RotationPanel';
import { PhasePanel } from './controls/PhasePanel';
import { LiberoPanel } from './controls/LiberoPanel';
import { ConfigPicker } from './controls/ConfigPicker';
import { Tutorial } from './tutorial/Tutorial';
import { ExportMenu } from './export/ExportMenu';
import { ConfigEditor } from './editor/ConfigEditor';
import { CommentPanel } from './comments/CommentPanel';
import { InfoPanel } from './info/InfoPanel';
import { LanguageSwitcher } from './i18n/LanguageSwitcher';
import { useI18n } from './i18n/I18nContext';
import { builtInConfigs } from './configs';
import { getComment, resolveDiagramState } from './state/selectors';
import { useAppState } from './state/AppStateContext';
import './App.css';

function App() {
  const { state, dispatch, config, customConfigs, addCustomConfig, setComment } = useAppState();
  const { t } = useI18n();
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [view, setView] = useState<'viewer' | 'editor'>('viewer');
  // A custom entry overrides a built-in with the same id (e.g. a built-in
  // config with session-only comments layered on top — see setComment).
  const allConfigs = [...builtInConfigs.filter((c) => !customConfigs.some((cc) => cc.id === c.id)), ...customConfigs];

  if (view === 'editor') {
    return (
      <ConfigEditor
        availableConfigs={allConfigs}
        onClose={() => setView('viewer')}
        onApply={(newConfig) => {
          addCustomConfig(newConfig);
          dispatch({ type: 'SELECT_CONFIG', configId: newConfig.id });
          setView('viewer');
        }}
      />
    );
  }

  const { players, positions } = resolveDiagramState(
    config,
    state.phaseKey,
    state.setterPosition,
    state.activeLiberoId,
  );

  return (
    <div className="app">
      <header className="app__header">
        <h1>{t('app.title')}</h1>
        <div className="app__header-actions">
          <ConfigPicker
            configs={allConfigs}
            configId={state.configId}
            onSelect={(configId) => dispatch({ type: 'SELECT_CONFIG', configId })}
          />
          <LanguageSwitcher />
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
          <LiberoPanel
            config={config}
            activeLiberoId={state.activeLiberoId}
            onSelect={(liberoId) => dispatch({ type: 'SELECT_LIBERO', liberoId })}
          />
          <div className="app__button-row">
            <button type="button" className="app__tutorial-btn" onClick={() => setTutorialOpen(true)}>
              {t('app.tutorialButton')}
            </button>
            <button type="button" className="app__editor-btn" onClick={() => setView('editor')}>
              {t('app.editorButton')}
            </button>
            <button type="button" className="app__info-btn" onClick={() => setInfoOpen(true)}>
              {t('app.infoButton')}
            </button>
          </div>
          <ExportMenu
            config={config}
            team={state.team}
            phaseKey={state.phaseKey}
            setterPosition={state.setterPosition}
            activeLiberoId={state.activeLiberoId}
          />
        </div>
      </main>

      <footer className="app__footer">
        <p>{config.description}</p>
        <p>
          {t('app.footer.basedOn')} <a href="https://github.com/monkeysppp/VBRotations">VBRotations</a>{' '}
          {t('app.footer.by')} <a href="https://github.com/monkeysppp/">Andy Edwards</a>.
          <br />
          {t('app.footer.source')}{' '}
          <a href="https://github.com/napo/rotazionivolley">https://github.com/napo/rotazionivolley</a>
        </p>
      </footer>

      {tutorialOpen && <Tutorial onClose={() => setTutorialOpen(false)} />}
      {infoOpen && <InfoPanel onClose={() => setInfoOpen(false)} />}
    </div>
  );
}

export default App;
