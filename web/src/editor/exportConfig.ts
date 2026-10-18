import { safeParseFormationConfig, type FormationConfig } from '../configs/schema';
import { saveFile, type SaveOutcome } from '../export/platformSave';

export function validateDraft(draft: unknown) {
  return safeParseFormationConfig(draft);
}

export async function downloadConfig(config: FormationConfig): Promise<SaveOutcome> {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  return saveFile(blob, `${config.id}.json`);
}
