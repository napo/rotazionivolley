// Keeps every copy of the app version aligned with the single source of
// truth: the "version" field of the root package.json.
//
// Usage:
//   node scripts/sync-version.mjs                 write the version everywhere
//   node scripts/sync-version.mjs --check         fail if any copy differs
//   node scripts/sync-version.mjs --check --tag v2.2.0
//                                                 also fail if the release tag differs
//
// Normally run for you by `npm version <x.y.z>` (see the "version" script in
// package.json), which bumps the root version, syncs, commits and tags.
//
// Android versionCode and iOS CURRENT_PROJECT_VERSION (build numbers that
// must only ever grow) are derived from the version as
// major * 10000 + minor * 100 + patch, e.g. 2.1.0 -> 20100.
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const check = args.includes('--check');
const tagIndex = args.indexOf('--tag');
const tag = tagIndex === -1 ? null : args[tagIndex + 1];

const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version ?? '');
if (!match) throw new Error(`package.json: "version" deve essere x.y.z, trovato "${version}"`);
const [major, minor, patch] = match.slice(1).map(Number);
if (minor > 99 || patch > 99) throw new Error(`minor e patch devono essere <= 99 (versione ${version})`);
const buildNumber = String(major * 10000 + minor * 100 + patch);

/**
 * [file, pattern whose first group is replaced, new value, optional] — each
 * pattern must match exactly once, or at most once when optional.
 */
const targets = [
  ['web/package.json', /^ {2}"version": "([^"]*)"/m, version],
  ['web/src/version.ts', /APP_VERSION = '([^']*)'/, version],
  ['package-lock.json', /^ {4}"": \{\n {6}"name": "rotazionivolley",\n {6}"version": "([^"]*)"/m, version],
  ['package-lock.json', /^ {4}"web": \{\n {6}"version": "([^"]*)"/m, version],
  // Top-level copy that `npm version` adds and `npm install` drops again.
  ['package-lock.json', /^ {2}"version": "([^"]*)"\n\}/m, version, true],
  ['src-tauri/tauri.conf.json', /^ {2}"version": "([^"]*)"/m, version],
  ['src-tauri/Cargo.toml', /^\[package\]\nname = "app"\nversion = "([^"]*)"/m, version],
  ['src-tauri/Cargo.lock', /^name = "app"\nversion = "([^"]*)"/m, version],
  ['android/app/build.gradle', /versionCode (\d+)/, buildNumber],
  ['android/app/build.gradle', /versionName "([^"]*)"/, version],
  ['ios/App/App.xcodeproj/project.pbxproj', /MARKETING_VERSION = ([^;]*);/g, version],
  ['ios/App/App.xcodeproj/project.pbxproj', /CURRENT_PROJECT_VERSION = ([^;]*);/g, buildNumber],
];

const contents = new Map();
const mismatches = [];
for (const [file, pattern, value, optional = false] of targets) {
  let text = contents.get(file) ?? readFileSync(file, 'utf8');
  const found = [...text.matchAll(pattern.global ? pattern : new RegExp(pattern.source, pattern.flags + 'g'))];
  if ((found.length === 0 && !optional) || (!pattern.global && found.length > 1)) {
    throw new Error(`${file}: pattern ${pattern} trovato ${found.length} volte`);
  }
  for (const m of found) {
    if (m[1] !== value) mismatches.push(`${file}: ${m[1]} (atteso ${value})`);
  }
  text = text.replace(pattern, (whole, current) => whole.replace(current, value));
  contents.set(file, text);
}

if (tag !== null && tag.replace(/^v/i, '') !== version) {
  mismatches.push(`tag della release: ${tag} (atteso v${version})`);
}

if (check) {
  if (mismatches.length > 0) {
    console.error(`Versioni non allineate a package.json (${version}):\n  ${mismatches.join('\n  ')}`);
    console.error('Esegui: npm run version:sync');
    process.exit(1);
  }
  console.log(`Versioni allineate: ${version} (build ${buildNumber})`);
} else {
  for (const [file, text] of contents) writeFileSync(file, text);
  console.log(`Versione ${version} (build ${buildNumber}) scritta in: ${[...contents.keys()].join(', ')}`);
}
