# Changelog

Tutte le modifiche rilevanti di questo progetto sono documentate in questo file.

## [Non rilasciato]

### Aggiunto
- Avviso di aggiornamento nelle app installate (desktop, Android, iOS): segnala quando su GitHub è disponibile una versione più recente, e un messaggio di ringraziamento con invito a una donazione (facoltativa, stessa pagina PayPal degli altri progetti dell'autore) subito dopo un aggiornamento. Si può disattivare dalla pagina Info. L'app web resta esclusa: è sempre già l'ultima versione.
- App desktop (Windows/macOS/Linux): l'aggiornamento si scarica, verifica e installa in-app con un clic ("Aggiorna ora"), invece di aprire la pagina delle release. I pacchetti sono firmati digitalmente a questo scopo.
- App Android/iOS: l'avviso punta al download della release (su Android, direttamente l'APK) — qui l'installazione resta manuale, come già per il resto dell'app.

### Corretto
- Export (PNG/PDF/video) e "Scarica JSON" nelle app Android/iOS: venivano scritti in una cartella cache temporanea e offerti solo tramite la finestra di condivisione del sistema, quindi se questa veniva chiusa senza scegliere nulla il file andava perso. Ora vengono salvati subito nella cartella Documenti dell'app (visibile da un file manager), con la condivisione offerta in aggiunta.
- App desktop (Tauri): la finestra "Salva con nome" ora si apre di default nella cartella Download e filtra per l'estensione del file, invece di aprirsi senza queste indicazioni.

## [2.1.0] - 2026-09-19

### Aggiunto
- Pagina Info e README: gli schemi creati restano sul dispositivo e non sul server centrale; si possono condividere come file JSON da importare.
- Editor: bollo "P2" per giocare con due palleggiatori (l'Opposto diventa P2 e P diventa P1; le rotazioni restano riferite al primo palleggiatore). Cliccando "O" si torna al modulo con un solo palleggiatore.
- Pulsante "Cancella" per eliminare uno schema personalizzato, sia nell'elenco degli schemi sia nell'editor (con conferma).
- Gli schemi creati nell'editor (e le note) vengono salvati nel browser e ricaricati all'avvio, invece di perdersi al ricaricamento della pagina.

### Modificato
- Nell'editor "Applica come schema attivo" diventa "Salva".

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
