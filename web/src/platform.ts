import { isTauri } from '@tauri-apps/api/core';
import { Capacitor } from '@capacitor/core';

/**
 * True only for the plain web build (e.g. GitHub Pages) — false once wrapped
 * in Tauri (desktop) or Capacitor (Android/iOS). Same runtime feature
 * detection as export/platformSave.ts, since it's the same web build running
 * unmodified everywhere.
 */
export function isWebPlatform(): boolean {
  return !isTauri() && !Capacitor.isNativePlatform();
}

/** iPhone/iPad, including iPadOS which reports itself as a Mac with touch. */
export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** True when the web build runs as an installed PWA (from the home screen) rather than in a browser tab. */
export function isInstalledPwa(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}
