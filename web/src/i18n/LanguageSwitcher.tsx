import { useI18n } from './I18nContext';
import type { Lang } from './strings';
import './language.css';

const LANGS: { code: Lang; label: string }[] = [
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
];

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <select
      className="language-switcher"
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      aria-label={t('language.label')}
    >
      {LANGS.map(({ code, label }) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );
}
