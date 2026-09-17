import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { strings, type Lang, type StringKey } from './strings';

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: StringKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'rv-lang';

// Defaults to Italian regardless of browser locale — this is an Italian
// volleyball tool first; auto-switching from an OS/browser locale would
// surprise Italian-speaking users on an English-configured device. English
// is available via the explicit toggle and remembered once chosen.
function detectInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'it' || stored === 'en') return stored;
  } catch {
    // localStorage unavailable (private mode, etc.) — fall through to the default.
  }
  return 'it';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore — per-viewer convenience only
    }
  }, []);

  const t = useCallback(
    (key: StringKey, params?: Record<string, string | number>) => {
      let text: string = strings[lang][key] ?? strings.it[key] ?? key;
      if (params) {
        for (const [name, value] of Object.entries(params)) {
          text = text.replaceAll(`{${name}}`, String(value));
        }
      }
      return text;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n deve essere usato dentro <I18nProvider>');
  }
  return ctx;
}
