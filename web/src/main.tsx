import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AppStateProvider } from './state/AppStateContext.tsx';
import { I18nProvider } from './i18n/I18nContext.tsx';
import { isWebPlatform } from './platform.ts';
import { setPwaUpdateReady, watchForPwaUpdates } from './update/pwaUpdates.ts';

// Service worker (offline use + updates, see vite.config.ts) only for the
// plain web build: the desktop/mobile apps ship their files inside the app
// and have their own update flow (update/updates.ts).
if (import.meta.env.PROD && isWebPlatform() && 'serviceWorker' in navigator) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      onNeedRefresh: () => setPwaUpdateReady(() => updateSW(true)),
      onRegisteredSW: (_url, registration) => {
        if (registration) watchForPwaUpdates(registration);
      },
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AppStateProvider>
        <App />
      </AppStateProvider>
    </I18nProvider>
  </StrictMode>,
);
