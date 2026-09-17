import type { FormationConfig } from '../configs/schema';
import { useI18n } from '../i18n/I18nContext';
import './controls.css';

interface ConfigPickerProps {
  configs: FormationConfig[];
  configId: string;
  onSelect: (configId: string) => void;
}

export function ConfigPicker({ configs, configId, onSelect }: ConfigPickerProps) {
  const { t } = useI18n();
  if (configs.length <= 1) {
    return null;
  }

  return (
    <label className="config-picker">
      {t('configPicker.label')}
      <select value={configId} onChange={(e) => onSelect(e.target.value)}>
        {configs.map((config) => (
          <option key={config.id} value={config.id}>
            {config.name}
          </option>
        ))}
      </select>
    </label>
  );
}
