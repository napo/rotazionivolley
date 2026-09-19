import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { defaultConfig, getConfigById } from '../configs';
import { safeParseFormationConfig, type FormationConfig, type SetterPosition } from '../configs/schema';
import { withComment } from './selectors';

export type Team = 'serve' | 'receive';

export interface AppState {
  configId: string;
  setterPosition: SetterPosition;
  team: Team;
  phaseKey: string;
  highlightedPlayerId: string | null;
  activeLiberoId: string | null;
}

export type AppAction =
  | { type: 'SELECT_ROTATION'; setterPosition: SetterPosition; team: Team }
  | { type: 'SELECT_PHASE'; phaseKey: string }
  | { type: 'TOGGLE_HIGHLIGHT'; playerId: string }
  | { type: 'SELECT_CONFIG'; configId: string }
  | { type: 'SELECT_LIBERO'; liberoId: string | null };

function initialStateFor(configId: string): AppState {
  return {
    configId,
    setterPosition: 2,
    team: 'serve',
    phaseKey: 'base',
    highlightedPlayerId: null,
    activeLiberoId: null,
  };
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SELECT_ROTATION':
      return { ...state, setterPosition: action.setterPosition, team: action.team, phaseKey: 'base' };
    case 'SELECT_PHASE':
      return { ...state, phaseKey: action.phaseKey };
    case 'TOGGLE_HIGHLIGHT':
      return {
        ...state,
        highlightedPlayerId: state.highlightedPlayerId === action.playerId ? null : action.playerId,
      };
    case 'SELECT_CONFIG':
      return initialStateFor(action.configId);
    case 'SELECT_LIBERO':
      return { ...state, activeLiberoId: action.liberoId };
    default:
      return state;
  }
}

interface AppStateContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  config: FormationConfig;
  /**
   * Configs created in the editor, or built-ins with session-only edits
   * layered on top (e.g. comments typed in the viewer — see setComment),
   * persisted in localStorage (see loadCustomConfigs). When an entry's id matches a built-in, it
   * takes priority over it (see `config` below).
   */
  customConfigs: FormationConfig[];
  addCustomConfig: (config: FormationConfig) => void;
  /** Removes a custom entry (for a built-in id, this drops its overrides and restores the original). */
  removeCustomConfig: (configId: string) => void;
  /** Sets the comment for the given (phase, rotation) on the active config. */
  setComment: (phaseKey: string, setterPosition: SetterPosition, text: string) => void;
}

const CUSTOM_CONFIGS_KEY = 'rv-custom-configs';

// Entries that no longer validate (schema changed, hand-edited storage) are
// dropped rather than breaking startup.
function loadCustomConfigs(): FormationConfig[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CONFIGS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      const result = safeParseFormationConfig(entry);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultConfig.id, initialStateFor);
  const [customConfigs, setCustomConfigs] = useState<FormationConfig[]>(loadCustomConfigs);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_CONFIGS_KEY, JSON.stringify(customConfigs));
    } catch {
      // storage full/unavailable — schemes just stay session-only
    }
  }, [customConfigs]);

  const addCustomConfig = useCallback((config: FormationConfig) => {
    setCustomConfigs((prev) => [...prev.filter((c) => c.id !== config.id), config]);
  }, []);

  const removeCustomConfig = useCallback((configId: string) => {
    setCustomConfigs((prev) => prev.filter((c) => c.id !== configId));
  }, []);

  const config = useMemo(
    () => customConfigs.find((c) => c.id === state.configId) ?? getConfigById(state.configId) ?? defaultConfig,
    [state.configId, customConfigs],
  );

  const setComment = useCallback(
    (phaseKey: string, setterPosition: SetterPosition, text: string) => {
      addCustomConfig(withComment(config, phaseKey, setterPosition, text));
    },
    [config, addCustomConfig],
  );

  const value = useMemo(
    () => ({ state, dispatch, config, customConfigs, addCustomConfig, removeCustomConfig, setComment }),
    [state, config, customConfigs, addCustomConfig, removeCustomConfig, setComment],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState deve essere usato dentro <AppStateProvider>');
  }
  return ctx;
}
