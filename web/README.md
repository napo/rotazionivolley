# Rotazioni volley — app React

Riscrittura in React + TypeScript + Vite dell'app di schemi di rotazione pallavolo, con dati di
posizionamento in un repository di file JSON (`src/configs/`). Campo e giocatori sono renderizzati
con [Konva](https://konvajs.org) (canvas), supporto per il Libero, commenti per rotazione/fase
esportabili come sottotitoli, editor visuale, export PNG/PDF/video, e interfaccia bilingue (IT/EN).

## Sviluppo

```bash
npm install       # dalla root del repo (workspace npm)
npm run dev        # avvia il dev server su http://localhost:5173
npm run build       # build di produzione in web/dist
npm run test        # unit/component test (Vitest)
npm run test:e2e     # test end-to-end (Playwright)
npm run typecheck    # controllo tipi
```

## Struttura

- `src/configs/` — schema Zod (`schema.ts`) e repository di configurazioni JSON (una per schema di formazione)
- `src/court/` — rendering canvas (Konva) del campo e dei giocatori, più il renderer condiviso
  usato da export PNG/PDF/video (`canvasRenderer.ts`)
- `src/controls/` — pannelli di rotazione, fase, Libero e selezione schema
- `src/editor/` — editor visuale drag & drop per creare/modificare schemi JSON (vista a pagina piena)
- `src/export/` — export PNG, PDF (incl. sequenza/pipeline) e video (.webm)
- `src/comments/` — pannello commenti per rotazione/fase, salvato nel JSON dello schema
- `src/i18n/` — dizionari IT/EN e selettore lingua (chrome dell'interfaccia; i dati degli schemi
  restano nella lingua in cui sono stati scritti)
- `src/info/` — pannello informazioni progetto/autore/licenza
- `src/tutorial/` — tutorial guidato
- `src/state/` — stato applicativo e selettori (incl. logica di sostituzione Libero)
- `e2e/` — test end-to-end Playwright

## Packaging nativo (Tauri + Capacitor)

Lo stesso build web (`web/dist`) viene impacchettato per desktop con
[Tauri](https://tauri.app) (`src-tauri/`) e per mobile con
[Capacitor](https://capacitorjs.com) (`android/`, `ios/`, `capacitor.config.ts`
alla root del repo). `platformSave.ts` sceglie a runtime come salvare i file
esportati (download browser / dialog nativo Tauri / Filesystem+Share
Capacitor), quindi il codice dell'app non cambia tra le piattaforme.

Comandi utili dalla root del repo:

```bash
npm run tauri:dev        # avvia l'app desktop in modalità sviluppo (Linux/Windows/macOS)
npm run tauri:build       # build di produzione desktop (richiede Rust/Cargo)

npm run build && npx cap sync   # ricopia web/dist nei progetti nativi dopo ogni build

npm run cap:android       # apre il progetto Android Studio (richiede Android SDK)
npm run cap:ios           # apre il progetto Xcode (richiede macOS + Xcode)
```

Requisiti per compilare da sorgente, per piattaforma:

| Piattaforma | Richiede |
| --- | --- |
| Web (GitHub Pages) | solo Node/npm |
| Linux / Windows (Tauri) | Rust + Cargo, toolchain webview di sistema (`webkit2gtk` su Linux) |
| Android (Capacitor) | Android SDK + JDK 21 |
| iOS (Capacitor) | macOS + Xcode (non compilabile su Linux/Windows) |

### Build in CI (GitHub Actions)

- `.github/workflows/ci.yml` — typecheck, build, unit test ed e2e ad ogni push/PR.
- `.github/workflows/desktop-build.yml` — build Tauri per Linux, Windows e macOS (matrix),
  artefatti caricati come build artifact di ogni run.
- `.github/workflows/ios-build.yml` — build "smoke" non firmata per Simulator iOS su
  runner `macos-latest` (verifica solo che il progetto compili; una build firmata per
  App Store richiede certificato/provisioning profile dell'Apple Developer account del
  proprietario del repo, da configurare come secret — non incluso qui).
- `.github/workflows/android-build.yml` — build dell'APK Android (debug-signed,
  installabile) ad ogni **release pubblicata** su GitHub (oltre che manualmente),
  allegato automaticamente agli asset della release. Una build firmata per il Play
  Store richiederebbe un keystore di release configurato come secret, non incluso qui.
