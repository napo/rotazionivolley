import { isTauri } from '@tauri-apps/api/core';
import { Capacitor } from '@capacitor/core';

/**
 * Update check for the installed apps (Tauri desktop, Capacitor Android/iOS)
 * — never for the plain web build, which is always the latest version
 * already. Unlike volleyreportxls's Tauri-mobile build, this project's
 * Android/iOS apps are Capacitor, which has no auto-updater: every platform
 * here just points the user at the GitHub release to download by hand (the
 * desktop installers and the APK), rather than installing it for them.
 * Only the version number is requested from GitHub — no other data leaves
 * the device.
 */
const SOURCE_REPOSITORY = 'napo/rotazionivolley';
const RELEASES_API = `https://api.github.com/repos/${SOURCE_REPOSITORY}/releases/latest`;
const RELEASES_URL = `https://github.com/${SOURCE_REPOSITORY}/releases/latest`;

const CHECKS_SETTING = 'rv-update-checks';
const LAST_VERSION_SETTING = 'rv-last-version';

export type NativePlatform = 'desktop' | 'android' | 'ios';

/** null on the plain web build — see the module doc above. */
export function nativePlatform(): NativePlatform | null {
  if (isTauri()) return 'desktop';
  if (Capacitor.isNativePlatform()) return Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
  return null;
}

/** False on the plain web build, which has no update check (see nativePlatform). */
export function isNativeBuild(): boolean {
  return nativePlatform() !== null;
}

/** Numeric comparison of dotted versions, an optional leading "v" ignored: compareVersions('2.2.0', 'v2.1.0') > 0. */
export function compareVersions(a: string, b: string): number {
  const parts = (v: string) => v.replace(/^v/i, '').split('.').map((p) => Number.parseInt(p, 10) || 0);
  const x = parts(a);
  const y = parts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const diff = (x[i] ?? 0) - (y[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function updateChecksEnabled(): boolean {
  try {
    return localStorage.getItem(CHECKS_SETTING) !== 'off';
  } catch {
    return true;
  }
}

export function setUpdateChecksEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(CHECKS_SETTING, enabled ? 'on' : 'off');
  } catch {
    // not persisted: default (enabled) at the next start
  }
}

/** Version seen at the previous start (null the first time), and records the current one. */
export function swapLastVersion(currentVersion: string): string | null {
  try {
    const previous = localStorage.getItem(LAST_VERSION_SETTING);
    localStorage.setItem(LAST_VERSION_SETTING, currentVersion);
    return previous;
  } catch {
    return null;
  }
}

interface ReleaseAsset {
  readonly name: string;
  readonly browser_download_url: string;
}

interface Release {
  readonly tag_name: string;
  readonly html_url?: string;
  readonly assets?: readonly ReleaseAsset[];
}

export interface UpdateInfo {
  readonly version: string;
  /** Where "download" should send the user: the release page, or (Android) the APK asset directly. */
  readonly url: string;
}

/** The release's APK asset — named "Rotazioni Volley-<version>.apk" by the Android build, see android-build.yml — skipping any "-debug" build. */
function androidAsset(release: Release): ReleaseAsset | undefined {
  return release.assets?.find((a) => /\.apk$/i.test(a.name) && !/debug/i.test(a.name));
}

/** A newer version than `currentVersion`, or null (none, web build, offline/unreachable). */
export async function checkForUpdate(
  currentVersion: string,
  fetchImpl: typeof fetch = fetch,
): Promise<UpdateInfo | null> {
  const platform = nativePlatform();
  if (!platform) return null;

  const response = await fetchImpl(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } });
  if (!response.ok) return null;
  const release = (await response.json()) as Release;
  const latest = (release.tag_name ?? '').replace(/^v/i, '');
  if (!latest || compareVersions(latest, currentVersion) <= 0) return null;

  const asset = platform === 'android' ? androidAsset(release) : undefined;
  return { version: latest, url: asset?.browser_download_url ?? release.html_url ?? RELEASES_URL };
}
