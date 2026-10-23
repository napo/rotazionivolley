import { useRef, useState } from 'react';
import type { FormationConfig, ReceptionZones } from './configs/schema';
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
import { UpdateNotice } from './update/UpdateNotice';
import { LanguageSwitcher } from './i18n/LanguageSwitcher';
import { useI18n } from './i18n/I18nContext';
import { builtInConfigs, defaultConfig } from './configs';
import { getComment, getPositions, resolveActiveLiberoSwap } from './state/selectors';
import { useAppState } from './state/AppStateContext';
import { checkPositionalFaults, getPositionalCheckPhases, getRotationZones } from './state/positionalFaults';
import { PositionalFaultOverlay } from './court/PositionalFaultOverlay';
import { PositionalFaultPanel } from './faults/PositionalFaultPanel';
import { ReceptionZonesHandles, ReceptionZonesUnderlay } from './court/ReceptionZonesLayer';
import { ReceptionZonesPanel } from './zones/ReceptionZonesPanel';
import { CourtToolsPanel, type CourtTool, type CourtToolKey } from './controls/CourtToolsPanel';
import {
  buildDefaultZones,
  getOnCourtIds,
  getReceptionPhase,
  resolveReceptionZones,
  withAreaChanged,
  withEdgeSplit,
  withVertexMoved,
  withVertexRemoved,
} from './state/receptionZones';
import './App.css';

function App() {
  const { state, dispatch, config, customConfigs, addCustomConfig, removeCustomConfig, setComment, setReceptionZones } =
    useAppState();
  const { t } = useI18n();
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const courtStageApiRef = useRef<CourtStageApi | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [view, setView] = useState<'viewer' | 'editor'>('viewer');
  const [editTarget, setEditTarget] = useState<FormationConfig | undefined>(undefined);
  // The open tab of the court tools panel — also which drawing is on court.
  const [activeTool, setActiveTool] = useState<CourtToolKey | null>(null);
  const [zonesEditing, setZonesEditing] = useState(false);
  // The map while a vertex is being dragged — saved to the config only on
  // drag end, so a drag doesn't rewrite stored schemes on every mouse move.
  const [draggedZones, setDraggedZones] = useState<ReceptionZones | null>(null);
  // A custom entry overrides a built-in with the same id (e.g. a built-in
  // config with session-only comments layered on top — see setComment).
  const allConfigs = [...builtInConfigs.filter((c) => !customConfigs.some((cc) => cc.id === c.id)), ...customConfigs];

  // Built-ins can't be removed, only custom schemes (a built-in that merely
  // carries custom overrides is not deletable either).
  const isDeletable = (c: FormationConfig) =>
    customConfigs.some((cc) => cc.id === c.id) && !builtInConfigs.some((b) => b.id === c.id);

  function deleteConfig(target: FormationConfig) {
    if (!window.confirm(t('editor.deleteConfirm', { name: target.name }))) return false;
    removeCustomConfig(target.id);
    if (state.configId === target.id) dispatch({ type: 'SELECT_CONFIG', configId: defaultConfig.id });
    return true;
  }

  if (view === 'editor') {
    return (
      <ConfigEditor
        availableConfigs={allConfigs}
        initialConfig={editTarget}
        onClose={() => setView('viewer')}
        onDelete={
          editTarget && isDeletable(editTarget)
            ? () => {
                if (deleteConfig(editTarget)) setView('viewer');
              }
            : undefined
        }
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

  // Positional faults: receiving side only (FIVB 2025-2028), at the service
  // hit — i.e. the reception formation, not "base" or later phases.
  const checkPhases = getPositionalCheckPhases(config.phases);
  const faultsAvailable = state.team === 'receive' && checkPhases.includes(state.phaseKey);
  const zones = faultsAvailable ? getRotationZones(config, state.setterPosition, activeSwap) : {};
  const relations = checkPositionalFaults(zones, positions);
  const faultsOn = activeTool === 'faults';
  const showFaults = faultsOn && faultsAvailable && relations.length > 0;
  const selectedForFaults =
    showFaults && state.highlightedPlayerId && zones[state.highlightedPlayerId] !== undefined
      ? state.highlightedPlayerId
      : null;

  // Reception competence map: receive side, reception phase only.
  const receptionPhase = getReceptionPhase(config.phases);
  const zonesAvailable = !!receptionPhase && state.team === 'receive' && state.phaseKey === receptionPhase;
  const resolvedZones = resolveReceptionZones(config, state.setterPosition, players, positions);
  const receptionZones = draggedZones ?? resolvedZones.zones;
  const showZones = activeTool === 'zones' && zonesAvailable && receptionZones.areas.length > 0;
  const editingZones = showZones && zonesEditing;
  const saveZones = (zones: ReceptionZones | undefined) => setReceptionZones(state.setterPosition, zones);
  // "Reset" goes back to the scheme's own map (a built-in ships one per
  // rotation), or to the one derived from the positions when it has none;
  // offered only once the map differs from that.
  const originalZones = builtInConfigs.find((c) => c.id === config.id)?.receptionZones[String(state.setterPosition)];
  const zonesCustomised =
    JSON.stringify(config.receptionZones[String(state.setterPosition)]) !== JSON.stringify(originalZones);

  // Only the tools that apply here: the reception formation of a receive
  // rotation. A tab whose tool isn't available just stays as it was until
  // it is again.
  const faultCount = relations.filter((r) => !r.ok).length;
  const courtTools: CourtTool[] = [];
  if (faultsAvailable && relations.length > 0) {
    courtTools.push({
      key: 'faults',
      label: t('faults.title'),
      alert:
        faultCount > 0
          ? {
              badge: String(faultCount),
              text: t(faultCount === 1 ? 'faults.summaryOne' : 'faults.summaryMany', { count: faultCount }),
            }
          : undefined,
      content: (
        <PositionalFaultPanel
          onSelectPlayer={(playerId) => dispatch({ type: 'SET_HIGHLIGHT', playerId })}
          players={players}
          zones={zones}
          relations={relations}
          selectedId={selectedForFaults}
        />
      ),
    });
  }
  if (zonesAvailable && receptionZones.areas.length > 0) {
    courtTools.push({
      key: 'zones',
      label: t('zones.title'),
      content: (
        <ReceptionZonesPanel
          editing={zonesEditing}
          onToggleEditing={() => setZonesEditing((on) => !on)}
          players={players}
          candidateIds={getOnCourtIds(players, positions).filter(
            (id) => players.find((p) => p.id === id)?.role !== 'setter',
          )}
          zones={receptionZones}
          onChangeArea={(playerId, change) => saveZones(withAreaChanged(receptionZones, playerId, change))}
          onSetReceivers={(ids) => saveZones(buildDefaultZones(ids, positions, players, receptionZones))}
          onReset={zonesCustomised ? () => saveZones(originalZones) : undefined}
        />
      ),
    });
  }

  return (
    <div className="app">
      <UpdateNotice />
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
            canDelete={isDeletable}
            onDelete={deleteConfig}
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
              screen={{ faults: showFaults ? { selectedId: selectedForFaults } : null, zones: showZones }}
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
            underlay={
              showZones ? (
                <ReceptionZonesUnderlay
                  zones={receptionZones}
                  revealDelayMs={ANIMATION_DURATION_MS}
                  revealKey={`${state.configId}-${state.setterPosition}`}
                />
              ) : null
            }
            overlay={
              <>
                {showFaults && (
                  <PositionalFaultOverlay
                    zones={zones}
                    positions={positions}
                    relations={relations}
                    selectedId={selectedForFaults}
                    revealDelayMs={ANIMATION_DURATION_MS}
                  />
                )}
                {editingZones && (
                  <ReceptionZonesHandles
                    zones={receptionZones}
                    onMoveVertex={(id, point) => setDraggedZones(withVertexMoved(receptionZones, id, point))}
                    onMoveEnd={() => {
                      if (draggedZones) saveZones(draggedZones);
                      setDraggedZones(null);
                    }}
                    onSplitEdge={(a, b) => saveZones(withEdgeSplit(receptionZones, a, b))}
                    onRemoveVertex={(id) => saveZones(withVertexRemoved(receptionZones, id))}
                  />
                )}
              </>
            }
          />
          <CourtToolsPanel tools={courtTools} activeKey={activeTool} onSelect={setActiveTool} />
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
