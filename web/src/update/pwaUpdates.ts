import { useSyncExternalStore } from 'react';

/**
 * Update flow for the web build installed as a PWA (or simply visited in a
 * browser): the service worker (registered in main.tsx, see vite.config.ts)
 * downloads a new version in the background and then waits; this store
 * holds the "apply it" callback until the user confirms in UpdateNotice.
 * Kept free of the `virtual:pwa-register` import so components and their
 * tests don't depend on the PWA build plugin.
 */
type ApplyUpdate = () => Promise<void>;

let applyUpdate: ApplyUpdate | null = null;
const listeners = new Set<() => void>();

export function setPwaUpdateReady(apply: ApplyUpdate): void {
  applyUpdate = apply;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The callback that installs the waiting version and reloads, or null when there is none. */
export function usePwaUpdate(): ApplyUpdate | null {
  return useSyncExternalStore(subscribe, () => applyUpdate);
}

/** How often an open app asks the server for a new version, besides each start and each return to the app. */
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

/** Periodic and on-return checks, so a PWA left open for days still finds new versions. */
export function watchForPwaUpdates(registration: ServiceWorkerRegistration): void {
  const check = () => {
    if (navigator.onLine) registration.update().catch(() => {});
  };
  setInterval(check, CHECK_INTERVAL_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
}
