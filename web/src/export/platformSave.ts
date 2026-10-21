import { isTauri } from '@tauri-apps/api/core';
import { downloadDir, join } from '@tauri-apps/api/path';
import { save as tauriSaveDialog } from '@tauri-apps/plugin-dialog';
import { writeFile as tauriWriteFile } from '@tauri-apps/plugin-fs';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isIosDevice } from '../platform';

/**
 * What actually happened to the file, so the caller can tell the user when
 * (and only when) there was no OS "save" dialog to confirm it for them —
 * see SaveOutcome.kind === 'mobile' and ExportMenu's use of it.
 */
export type SaveOutcome =
  /** The browser download flow (web build): the browser's own UI is the confirmation. */
  | { kind: 'web' }
  /** iPhone/iPad web build: the share sheet was shown (it offers "Save to Files"). */
  | { kind: 'shared' }
  /** iPhone/iPad web build: the file is ready but iOS only opens the share
   *  sheet straight after a tap, and the export took too long — the caller
   *  shows a button that calls `share` from a fresh tap. */
  | { kind: 'shareReady'; share: () => Promise<SaveOutcome> }
  /** Tauri's native Save As dialog was shown and the user picked a location. */
  | { kind: 'tauri'; path: string }
  /** The user cancelled the Save As dialog/picker — nothing was written. */
  | { kind: 'cancelled' }
  /** Capacitor (Android/iOS): the native SaveAs picker was shown and the
   *  user picked a location. */
  | { kind: 'mobilePicked' }
  /** Capacitor fallback when the SaveAs plugin isn't available: the file was
   *  written straight to a location the user can find on their own (see
   *  saveFileCapacitor) — the caller should say so. */
  | { kind: 'mobile' };

/**
 * App-local native plugin (android/.../SaveAsPlugin.java,
 * ios/App/App/SaveAsPlugin.swift): shows the OS "save as" picker and copies
 * the file at `path` to wherever the user chooses.
 */
interface SaveAsPlugin {
  save(options: { path: string; filename: string; mimeType: string }): Promise<{ saved: boolean }>;
}

const SaveAs = registerPlugin<SaveAsPlugin>('SaveAs');

/**
 * Single point where export code hands off a finished file, so png.ts/pdf.ts/
 * video.ts/exportConfig.ts never need to know which platform they're running
 * on. Branch chosen via runtime feature detection (not a build-time flag) so
 * the exact same web build works unmodified on GitHub Pages, wrapped in
 * Tauri, or wrapped in Capacitor.
 */
export async function saveFile(blob: Blob, filename: string): Promise<SaveOutcome> {
  if (isTauri()) {
    return saveFileTauri(blob, filename);
  }
  if (Capacitor.isNativePlatform()) {
    return saveFileCapacitor(blob, filename);
  }
  const file = new File([blob], filename, { type: blob.type });
  if (isIosDevice() && navigator.canShare?.({ files: [file] })) {
    return shareFileWeb(file);
  }
  saveFileWeb(blob, filename);
  return { kind: 'web' };
}

/**
 * iOS (Safari or the installed PWA) has no usable "download" for generated
 * files — they open in a viewer, or nowhere in a home-screen app — so they go
 * through the share sheet, whose "Save to Files" lets the user pick where.
 */
async function shareFileWeb(file: File): Promise<SaveOutcome> {
  try {
    await navigator.share({ files: [file] });
    return { kind: 'shared' };
  } catch (err) {
    const name = (err as { name?: string }).name;
    if (name === 'AbortError') return { kind: 'cancelled' };
    // The tap that started the export has expired (long PDF/video).
    if (name === 'NotAllowedError') return { kind: 'shareReady', share: () => shareFileWeb(file) };
    throw err;
  }
}

function saveFileWeb(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? '' : filename.slice(dot + 1);
}

async function saveFileTauri(blob: Blob, filename: string): Promise<SaveOutcome> {
  // Default to the OS Downloads folder (falling back to just the bare
  // filename if it can't be resolved) so the dialog opens somewhere
  // predictable instead of wherever it was last left, and restrict it to
  // the file's own extension so it can't accidentally be saved without one.
  const extension = extensionOf(filename);
  const defaultPath = await join(await downloadDir(), filename).catch(() => filename);
  const path = await tauriSaveDialog({
    defaultPath,
    filters: extension ? [{ name: extension.toUpperCase(), extensions: [extension] }] : undefined,
  });
  if (!path) {
    return { kind: 'cancelled' }; // user cancelled the save dialog
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  await tauriWriteFile(path, bytes);
  return { kind: 'tauri', path };
}

async function saveFileCapacitor(blob: Blob, filename: string): Promise<SaveOutcome> {
  const base64Data = await blobToBase64(blob);
  // Written to Cache first under its final name (the iOS picker exports the
  // file as-is, name included), then handed to the native SaveAs picker so
  // the user chooses where it goes.
  const temp = await Filesystem.writeFile({
    path: filename,
    data: base64Data,
    directory: Directory.Cache,
  });
  try {
    const { saved } = await SaveAs.save({
      path: temp.uri,
      filename,
      mimeType: blob.type || 'application/octet-stream',
    });
    return saved ? { kind: 'mobilePicked' } : { kind: 'cancelled' };
  } catch (err) {
    // Only fall back when the plugin is missing (e.g. an older native shell);
    // a real write failure should surface as an error.
    if ((err as { code?: string }).code !== 'UNIMPLEMENTED') throw err;
    return saveFileCapacitorFallback(base64Data, filename);
  } finally {
    await Filesystem.deleteFile({ path: filename, directory: Directory.Cache }).catch(() => undefined);
  }
}

async function saveFileCapacitorFallback(base64Data: string, filename: string): Promise<SaveOutcome> {
  // Permissions only matter on Android 10 and older (Directory.Documents is
  // unrestricted scoped storage from Android 11 on, and ignored on iOS) —
  // request them defensively and press on regardless of the outcome.
  await Filesystem.requestPermissions().catch(() => undefined);
  // Written to Documents, not Cache: Cache is private, ephemeral storage the
  // OS can purge at any time and the user can't browse to, so a file saved
  // there only survives if the user immediately picks somewhere else to put
  // it from the share sheet below. Documents is the persisted, user-visible
  // location both platforms offer without a native "save as" picker — see
  // AndroidManifest.xml (legacy storage permissions, pre-11) and Info.plist
  // (UIFileSharingEnabled/LSSupportsOpeningDocumentsInPlace) for the rest.
  const written = await Filesystem.writeFile({
    path: filename,
    data: base64Data,
    directory: Directory.Documents,
  });
  // Still offer the OS share sheet as a bonus — the export is already safe
  // in Documents either way, so a cancelled/unavailable share isn't an error.
  await Share.share({ url: written.uri }).catch(() => undefined);
  return { kind: 'mobile' };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Impossibile leggere il file'));
    reader.readAsDataURL(blob);
  });
}
