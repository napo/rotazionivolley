import { safeParseFormationConfig, type FormationConfig } from '../configs/schema';
import { saveFile } from '../export/platformSave';

export function validateDraft(draft: unknown) {
  return safeParseFormationConfig(draft);
}

export async function downloadConfig(config: FormationConfig): Promise<void> {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  await saveFile(blob, `${config.id}.json`);
}
