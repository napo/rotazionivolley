# Changelog

Tutte le modifiche rilevanti di questo progetto sono documentate in questo file.

## [2.4.0] - 2026-10-23

### Aggiunto
- Competenze di ricezione: nella formazione di ricezione il campo si può dividere in una zona colorata per ogni ricevitore, con una fascia più scura lungo i confini per indicare chi prende la palla che cade lì (lati sinistra/destra/avanti/dietro dal punto di vista del giocatore). Le zone si modificano trascinando i vertici condivisi, aggiungendo o togliendo vertici e zone; i conflitti (nessuno o entrambi competenti su un confine) vengono segnalati, e si possono ripristinare le zone di partenza. Gli schemi predefiniti includono già le loro competenze; per gli altri vengono ricavate dalle posizioni dei giocatori.
- Export: PNG e PDF a pagina singola includono quello che si vede sul campo (falli di posizione e/o competenze). PDF a più pagine e video hanno le caselle "Includi" per aggiungere, dopo ogni formazione di ricezione della sequenza, i falli di posizione (tutta la squadra, poi un giocatore alla volta) e le competenze di ricezione.

### Modificato
- Falli di posizione e competenze di ricezione sono ora due schede di un pannello di strumenti sotto il campo, disponibile nella fase Ricezione delle rotazioni in ricezione; un clic sulla scheda la mostra sul campo, un nuovo clic la chiude. Un bollino rosso sulla scheda segnala i falli presenti. Aggiornato il passo del tutorial.

## [2.3.0] - 2026-10-22

### Aggiunto
- Falli di posizione: pulsanti per scegliere tra la vista di un singolo giocatore (solo i suoi possibili falli) e "Tutta la formazione"; un avviso segnala sempre i falli presenti, anche con l'overlay nascosto. Nell'editor i falli creati trascinando i giocatori nella formazione di ricezione vengono segnalati subito, con l'overlay sul campo. Nuovo passo del tutorial dedicato ai falli.
- Export con i falli di posizione: se la vista dei falli è attiva, il PNG li disegna come a schermo (tutta la squadra o il giocatore scelto); il video, nelle formazioni di ricezione, aggiunge un fotogramma con i falli di tutta la squadra e poi uno per giocatore nell'ordine P, S1, C2, O, S2, C1 (con il libero al posto del centrale che sostituisce).
- Pagina Info: sezione "Sostieni lo sviluppo" con la donazione volontaria tramite PayPal (stesso approccio di analisirefertogara). L'app la ricorda solo negli avvisi di aggiornamento, ora anche in quello della versione web/PWA.

### Modificato
- Licenza: il progetto passa da Apache 2.0 a GNU Affero General Public License v3.0 or later (`AGPL-3.0-or-later`). Le parti derivate da VBRotations conservano l'attribuzione Apache 2.0.

### Corretto
- App desktop: i link esterni (GitHub, donazione, download) ora si aprono nel browser di sistema.
- Il controllo delle versioni falliva su Windows (a-capo CRLF), per cui la 2.2.0 non ha installer Windows né aggiornamento in-app per il desktop.

## [2.2.0] - 2026-10-22

### Aggiunto
- Falli di posizione: in Ricezione (fasi "Base" e "Ricezione") il pulsante "Mostra" sotto il campo disegna un overlay con la zona di rotazione di ogni giocatore e le coppie adiacenti da rispettare (tratteggio verde = ok, linea rossa = fallo). Cliccando un giocatore compaiono le frecce verso chi deve avere davanti/dietro/a sinistra/a destra, con la spiegazione. Segue il regolamento FIVB 2025-2028: la squadra al servizio è libera.
- Avviso di aggiornamento nelle app installate (desktop, Android, iOS): segnala quando su GitHub è disponibile una versione più recente, e un messaggio di ringraziamento con invito a una donazione (facoltativa, stessa pagina PayPal degli altri progetti dell'autore) subito dopo un aggiornamento. Si può disattivare dalla pagina Info. Per la versione web/PWA vedi sotto.
- App desktop (Windows/macOS/Linux): l'aggiornamento si scarica, verifica e installa in-app con un clic ("Aggiorna ora"), invece di aprire la pagina delle release. I pacchetti sono firmati digitalmente a questo scopo.
- App Android/iOS: l'avviso punta al download della release (su Android, direttamente l'APK) — qui l'installazione resta manuale, come già per il resto dell'app.
- App installabile come PWA (anche su iPhone/iPad, da Safari → "Aggiungi alla schermata Home"), utilizzabile senza connessione. Quando esce una nuova versione viene scaricata in background e l'app propone "Aggiorna ora". Su iPhone/iPad un avviso (una sola volta) spiega come installarla.
- Su iPhone/iPad gli export (PNG, PDF, video, JSON) si salvano tramite la condivisione di sistema, che permette di scegliere dove ("Salva su File").
- Nuovo schema predefinito e secondo schema "… ed S1 che attacca sempre da 4".
- Export video anche in MP4 dove il WebM non è disponibile (Safari).
- Versione unica: `npm version x.y.z` aggiorna la versione in tutte le build (web, desktop, Android, iOS) e la CI fallisce se una copia non è allineata o non corrisponde al tag della release. Corretta la versione iOS, rimasta a 2.0.

### Corretto
- Export (PNG/PDF/video) e "Scarica JSON" nelle app Android/iOS: venivano scritti in una cartella cache temporanea e offerti solo tramite la finestra di condivisione del sistema, quindi se questa veniva chiusa senza scegliere nulla il file andava perso. Ora si apre il selettore di sistema per scegliere la cartella di destinazione; se non è disponibile (versione nativa precedente), il file viene salvato nella cartella Documenti dell'app con la condivisione offerta in aggiunta.
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
