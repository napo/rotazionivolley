import { isTauri } from '@tauri-apps/api/core';
import { Capacitor } from '@capacitor/core';

/**
 * Update check for the installed apps (Tauri desktop, Capacitor Android/iOS)
 * — never for the plain web build, which is always the latest version
 * already.
 * - Desktop: the Tauri updater plugin itself checks a signed latest.json
 *   published on each GitHub release (see .github/workflows/desktop-build.yml
 *   and scripts/updater-manifest.mjs) and, once the user confirms, downloads,
 *   verifies and installs the update, then restarts the app.
 * - Android/iOS: this project's mobile apps are Capacitor, which has no
 *   auto-updater (and Tauri's doesn't support mobile either) — so there the
 *   app just reads the plain GitHub Releases API and points the user at the
 *   release (the APK, on Android) to download and install by hand.
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

type DesktopUpdate = Awaited<ReturnType<typeof import('@tauri-apps/plugin-updater').check>>;

export type UpdateInfo =
  /** Desktop: `update` is the Tauri plugin's own handle — see installUpdate. */
  | { readonly kind: 'desktop'; readonly version: string; readonly update: NonNullable<DesktopUpdate> }
  /** Android/iOS: nothing to install in-app — `url` is where the user downloads it themselves. */
  | { readonly kind: 'mobile'; readonly version: string; readonly url: string };

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

  if (platform === 'desktop') {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();
    return update ? { kind: 'desktop', version: update.version, update } : null;
  }

  const response = await fetchImpl(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } });
  if (!response.ok) return null;
  const release = (await response.json()) as Release;
  const latest = (release.tag_name ?? '').replace(/^v/i, '');
  if (!latest || compareVersions(latest, currentVersion) <= 0) return null;

  const asset = platform === 'android' ? androidAsset(release) : undefined;
  return { kind: 'mobile', version: latest, url: asset?.browser_download_url ?? release.html_url ?? RELEASES_URL };
}

/** Desktop only: download, verify, install (the user already confirmed) and restart. onProgress(0..1, or null while the total size is still unknown). */
export async function installUpdate(
  info: Extract<UpdateInfo, { kind: 'desktop' }>,
  onProgress: (progress: number | null) => void,
): Promise<void> {
  let total = 0;
  let received = 0;
  await info.update.downloadAndInstall((event) => {
    if (event.event === 'Started') total = event.data.contentLength ?? 0;
    if (event.event === 'Progress') {
      received += event.data.chunkLength;
      onProgress(total ? received / total : null);
    }
    if (event.event === 'Finished') onProgress(1);
  });
  const { relaunch } = await import('@tauri-apps/plugin-process');
  await relaunch();
}
