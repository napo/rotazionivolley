import ricezioneA3Raw from './ricezione-a-3.json';
import ricezioneA3S1Da4Raw from './ricezione-a-3-s1-attacco-da-4.json';
import { parseFormationConfig, type FormationConfig } from './schema';

const builtInRaw: unknown[] = [ricezioneA3Raw, ricezioneA3S1Da4Raw];

export const builtInConfigs: FormationConfig[] = builtInRaw.map(parseFormationConfig);

export function getConfigById(id: string): FormationConfig | undefined {
  return builtInConfigs.find((config) => config.id === id);
}

export const defaultConfig: FormationConfig = builtInConfigs[0];

export type { FormationConfig } from './schema';
