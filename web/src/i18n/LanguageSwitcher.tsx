import { useI18n } from './I18nContext';
import type { Lang } from './strings';
import './language.css';

const LANGS: { code: Lang; label: string }[] = [
  { code: 'it', label: 'IT' },
  { code: 'en', label: 'EN' },
];

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="language-switcher" role="group" aria-label={t('language.label')}>
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          className={`language-switcher__btn${lang === code ? ' is-active' : ''}`}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
