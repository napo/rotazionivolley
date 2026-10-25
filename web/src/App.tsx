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
import { VertexRemovalDialog } from './zones/VertexRemovalDialog';
import { setVertexRemovalConfirmEnabled, vertexRemovalConfirmEnabled } from './zones/zonePreferences';
import { CourtToolsPanel, type CourtTool, type CourtToolKey } from './controls/CourtToolsPanel';
import {
  buildDefaultZones,
  canRemoveVertex,
  findMergeTarget,
  getOnCourtIds,
  getReceptionPhase,
  resolveReceptionZones,
  withAreaChanged,
  withEdgeSplit,
  withReceptionZones,
  withVertexMoved,
  withVertexRemoved,
  withVerticesMerged,
} from './state/receptionZones';
import './App.css';

function App() {
  const { state, dispatch, config, customConfigs, addCustomConfig, removeCustomConfig, setComment, setReceptionZones } =
    useAppState();
  const { t } = useI18n();
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const courtStageApiRef = useRef<CourtStageApi | null>(null);
  const [view, setView] = useState<'viewer' | 'editor' | 'info'>('viewer');
  const [editTarget, setEditTarget] = useState<FormationConfig | undefined>(undefined);
  // The open tab of the court tools panel — also which drawing is on court.
  const [activeTool, setActiveTool] = useState<CourtToolKey | null>(null);
  const [zonesEditing, setZonesEditing] = useState(false);
  // Competence changes made in edit mode, for one rotation of one scheme
  // (`key`): written to the scheme in use only when approved with "Save".
  // `zones: undefined` is a draft back to the map derived from the positions.
  const [zonesDraft, setZonesDraft] = useState<{ key: string; zones: ReceptionZones | undefined } | null>(null);
  // The map while a vertex is being dragged — put in the draft only on drag
  // end, so a drag doesn't rebuild the draft on every mouse move.
  const [draggedZones, setDraggedZones] = useState<ReceptionZones | null>(null);
  // A vertex double clicked for removal, waiting for the confirmation dialog.
  const [vertexToRemove, setVertexToRemove] = useState<string | null>(null);
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

  // A draft for this rotation of this scheme, if any (one left from another
  // rotation was already saved or dropped by leaveZonesDraft).
  const zonesKey = `${config.id}-${state.setterPosition}`;
  const draft = zonesDraft?.key === zonesKey ? zonesDraft : null;
  const zonesDirty =
    !!draft && JSON.stringify(draft.zones) !== JSON.stringify(config.receptionZones[String(state.setterPosition)]);
  const saveZonesDraft = () => {
    if (zonesDirty) setReceptionZones(state.setterPosition, draft!.zones);
    setZonesDraft(null);
  };
  // Before leaving the rotation (or the scheme) shown: unsaved competence
  // changes are saved or dropped, as the user says, never carried along.
  const leaveZonesDraft = () => {
    if (zonesDirty && window.confirm(t('zones.unsavedConfirm', { position: state.setterPosition }))) saveZonesDraft();
    setZonesDraft(null);
    setDraggedZones(null);
  };
  const guardedDispatch: typeof dispatch = (action) => {
    if (action.type === 'SELECT_ROTATION' || action.type === 'SELECT_PHASE' || action.type === 'SELECT_CONFIG') {
      leaveZonesDraft();
    }
    dispatch(action);
  };

  if (view === 'info') {
    return <InfoPanel onClose={() => setView('viewer')} />;
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
  // What's shown is the draft while there is one, otherwise what the scheme has saved.
  const zonesConfig = draft ? withReceptionZones(config, state.setterPosition, draft.zones) : config;
  const resolvedZones = resolveReceptionZones(zonesConfig, state.setterPosition, players, positions);
  const receptionZones = draggedZones ?? resolvedZones.zones;
  const showZones = activeTool === 'zones' && zonesAvailable && receptionZones.areas.length > 0;
  const editingZones = showZones && zonesEditing;
  const editZones = (zones: ReceptionZones | undefined) => setZonesDraft({ key: zonesKey, zones });
  // "Reset" goes back to the scheme's own map (a built-in ships one per
  // rotation), or to the one derived from the positions when it has none;
  // offered only once the map differs from that.
  const originalZones = builtInConfigs.find((c) => c.id === config.id)?.receptionZones[String(state.setterPosition)];
  const zonesCustomised =
    JSON.stringify(zonesConfig.receptionZones[String(state.setterPosition)]) !== JSON.stringify(originalZones);
  const removeVertex = (id: string) => editZones(withVertexRemoved(receptionZones, id));

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
          dirty={zonesDirty}
          onStartEditing={() => setZonesEditing(true)}
          onSave={() => {
            saveZonesDraft();
            setZonesEditing(false);
          }}
          onDiscard={() => {
            setZonesDraft(null);
            setZonesEditing(false);
          }}
          players={players}
          candidateIds={getOnCourtIds(players, positions).filter(
            (id) => players.find((p) => p.id === id)?.role !== 'setter',
          )}
          zones={receptionZones}
          onChangeArea={(playerId, change) => editZones(withAreaChanged(receptionZones, playerId, change))}
          onSetReceivers={(ids) => editZones(buildDefaultZones(ids, positions, players, receptionZones))}
          onReset={zonesCustomised ? () => editZones(originalZones) : undefined}
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
            onSelect={(configId) => guardedDispatch({ type: 'SELECT_CONFIG', configId })}
            onEdit={(config) => {
              leaveZonesDraft();
              setEditTarget(config);
              setView('editor');
            }}
            canDelete={isDeletable}
            onDelete={deleteConfig}
            onAddNew={() => {
              leaveZonesDraft();
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
          <button
            type="button"
            className="app__header-btn"
            onClick={() => {
              leaveZonesDraft();
              setView('info');
            }}
          >
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
                    onMoveEnd={(id) => {
                      if (draggedZones) {
                        const target = findMergeTarget(draggedZones, id);
                        editZones(target ? withVerticesMerged(draggedZones, id, target) : draggedZones);
                      }
                      setDraggedZones(null);
                    }}
                    onSplitEdge={(a, b) => editZones(withEdgeSplit(receptionZones, a, b))}
                    onRequestRemoveVertex={(id) => {
                      if (canRemoveVertex(receptionZones, id) && !vertexRemovalConfirmEnabled()) removeVertex(id);
                      else setVertexToRemove(id);
                    }}
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
            onSelect={(setterPosition, team) => guardedDispatch({ type: 'SELECT_ROTATION', setterPosition, team })}
          />
          <PhasePanel
            config={config}
            team={state.team}
            phaseKey={state.phaseKey}
            onSelect={(phaseKey) => guardedDispatch({ type: 'SELECT_PHASE', phaseKey })}
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
      {vertexToRemove && (
        <VertexRemovalDialog
          removable={canRemoveVertex(receptionZones, vertexToRemove)}
          onCancel={() => setVertexToRemove(null)}
          onConfirm={(dontAskAgain) => {
            if (dontAskAgain) setVertexRemovalConfirmEnabled(false);
            removeVertex(vertexToRemove);
            setVertexToRemove(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
