import { isTauri } from '@tauri-apps/api/core';
import { save as tauriSaveDialog } from '@tauri-apps/plugin-dialog';
import { writeFile as tauriWriteFile } from '@tauri-apps/plugin-fs';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Single point where export code hands off a finished file, so png.ts/pdf.ts/
 * video.ts/exportConfig.ts never need to know which platform they're running
 * on. Branch chosen via runtime feature detection (not a build-time flag) so
 * the exact same web build works unmodified on GitHub Pages, wrapped in
 * Tauri, or wrapped in Capacitor.
 */
export async function saveFile(blob: Blob, filename: string): Promise<void> {
  if (isTauri()) {
    await saveFileTauri(blob, filename);
    return;
  }
  if (Capacitor.isNativePlatform()) {
    await saveFileCapacitor(blob, filename);
    return;
  }
  saveFileWeb(blob, filename);
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

async function saveFileTauri(blob: Blob, filename: string): Promise<void> {
  const path = await tauriSaveDialog({ defaultPath: filename });
  if (!path) {
    return; // user cancelled the save dialog
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  await tauriWriteFile(path, bytes);
}

async function saveFileCapacitor(blob: Blob, filename: string): Promise<void> {
  const base64Data = await blobToBase64(blob);
  const written = await Filesystem.writeFile({
    path: filename,
    data: base64Data,
    directory: Directory.Cache,
  });
  // No arbitrary native "save as" without extra plugins on mobile: hand the
  // file to the OS share sheet so the user can save/send it wherever they like.
  await Share.share({ url: written.uri });
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
