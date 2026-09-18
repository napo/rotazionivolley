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
