// Writes latest.json for the Tauri updater from a release's files (and their
// .sig signatures) — see web/src/update and .github/workflows/desktop-build.yml.
// The app reads https://github.com/napo/rotazionivolley/releases/latest/download/latest.json
// and looks up "<os>-<arch>". Only signed packages are listed; an unsigned
// build (no TAURI_SIGNING_PRIVATE_KEY at build time) is simply left out.
// Usage: node scripts/updater-manifest.mjs <release files dir> <tag> [repository]
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [dir, tag, repository = 'napo/rotazionivolley'] = process.argv.slice(2);
if (!dir || !tag) throw new Error('usage: updater-manifest.mjs <dir> <tag> [repository]');
const version = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8')).version;

// file pattern -> platform keys the updater looks up (first = most specific)
const RULES = [
  [/-setup\.exe$/, ['windows-x86_64-nsis', 'windows-x86_64']],
  [/\.msi$/, ['windows-x86_64-msi']],
  [/_aarch64\.app\.tar\.gz$/, ['darwin-aarch64-app', 'darwin-aarch64']],
  [/_x64\.app\.tar\.gz$/, ['darwin-x86_64-app', 'darwin-x86_64']],
  [/\.AppImage$/, ['linux-x86_64-appimage', 'linux-x86_64']],
];

const platforms = {};
for (const file of readdirSync(dir).sort()) {
  const rule = RULES.find(([pattern]) => pattern.test(file));
  const signature = join(dir, `${file}.sig`);
  if (!rule || !existsSync(signature)) continue;
  const entry = { signature: readFileSync(signature, 'utf8').trim(), url: `https://github.com/${repository}/releases/download/${tag}/${file}` };
  for (const key of rule[1]) if (!platforms[key]) platforms[key] = entry;
}
if (!Object.keys(platforms).length) throw new Error(`no signed package in ${dir}`);
const manifest = {
  version,
  notes: `Rotazioni Volley ${tag}: https://github.com/${repository}/releases/tag/${tag}`,
  pub_date: new Date().toISOString(),
  platforms,
};
writeFileSync(join(dir, 'latest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`latest.json ${version}: ${Object.keys(platforms).join(', ')}`);
