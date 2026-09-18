# Changelog

Tutte le modifiche rilevanti di questo progetto sono documentate in questo file.

## [2.0.1] - 2026-09-18

### Aggiunto
- Titolo in alto su ogni PNG/PDF/video esportato: squadra, rotazione e fase per l'export singolo; per le sequenze/pipeline, intestazione fissa (rotazione o "Tutte le fasi") più il nome dello schema, con la fase specifica su ogni pagina.
- Le note salvate per una rotazione/fase compaiono ora in tutti i formati di export (PNG, PDF, video), non solo nel PDF a pagina singola.
- Sequenza di export "Servizio rotazione P{n}" e "Ricezione rotazione P{n}": mostrano sempre il lato scelto, indipendentemente da quale squadra è visualizzata a schermo in quel momento.
- Favicon, immagine di anteprima social e icone native (Android/iOS) generate direttamente dal rendering dell'app, invece che disegnate a mano.
- Pagina Info: link alle versioni desktop/mobile su GitHub Releases, con note su Gatekeeper (macOS) e installazione da fonti sconosciute (Android).

### Corretto
- Il tutorial guidato ora evidenzia un singolo giocatore (non l'intero campo) nel primo passaggio, e la colonna Servizio/Ricezione corretta nel pannello Rotazione (prima veniva evidenziato l'intero pannello).
- L'ordine delle rotazioni nel navigatore e negli export segue ora la sequenza reale di gioco (P1, P6, P5, P4, P3, P2) invece dell'ordine numerico.

## [2.0] - 2026-09-17

Riscrittura in React: sostituzione del libero, navigatori ridisegnati, editor degli schemi.
