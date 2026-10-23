/** External addresses the app links to — plain links, nothing is contacted until the user opens one. */
export const SOURCE_REPOSITORY_URL = 'https://github.com/napo/rotazionivolley';

/** Voluntary donation (same PayPal account as the author's other apps, e.g. analisirefertogara). */
export const PAYPAL_DONATION_URL = 'https://paypal.me/MNapolitano570';

/**
 * Direct links to this version's installers on its GitHub Release, named as
 * the release workflows upload them (GitHub turns the space in "Rotazioni
 * Volley" into a dot). The web build carries the same version as the release.
 */
export function releaseDownloads(version: string): { label: string; href: string }[] {
  const base = `${SOURCE_REPOSITORY_URL}/releases/download/v${version}/Rotazioni.Volley`;
  return [
    { label: 'Windows (.exe)', href: `${base}_${version}_x64-setup.exe` },
    { label: 'Windows (.msi)', href: `${base}_${version}_x64_en-US.msi` },
    { label: 'macOS Apple Silicon (.dmg)', href: `${base}_${version}_aarch64.dmg` },
    { label: 'Linux (.AppImage)', href: `${base}_${version}_amd64.AppImage` },
    { label: 'Linux (.deb)', href: `${base}_${version}_amd64.deb` },
    { label: 'Linux (.rpm)', href: `${base}-${version}-1.x86_64.rpm` },
    { label: 'Android (.apk)', href: `${base}-${version}.apk` },
  ];
}
