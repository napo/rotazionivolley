# rotazioni volley
rappresentazione via web degli schemi di ricezione a 3 nella pallavolo rispetto alla posizione del palleggiatore

Questa applicazione web è la traduzione in italiano del progetto [VBRotations](https://github.com/monkeysppp/VBRotations) di [Andy Edwards](https://github.com/monkeysppp)

l'applicazione può essere usata a questo indirizzo [https://napo.github.io/rotazionivolley/](https://napo.github.io/rotazionivolley/)


## Cosa si può fare

- **Rotazioni e fasi**: naviga le sei rotazioni (in ricezione e in battuta) e le fasi di gioco, con i giocatori che si muovono in campo in modo animato.
- **Schemi inclusi**: due moduli di ricezione a tre con i due laterali ed il libero, il secondo con S1 che attacca sempre da 4 (cambia solo la P1). Entrambi hanno già le loro competenze di ricezione per ogni rotazione.
- **Editor degli schemi**: crea un nuovo modulo partendo da uno esistente (o importando un JSON), trascina i giocatori nelle posizioni volute per ogni rotazione e fase, scegli quando entra il libero, aggiungi note e salva. Gli schemi restano sul tuo dispositivo (nel browser o nell'app), non sul server centrale: si possono modificare, cancellare e scaricare come JSON. Per condividerli basta inviare il file JSON, che chi lo riceve può importare dall'editor.
- **Due palleggiatori**: nell'editor il bollo **P2** trasforma l'opposto in un secondo palleggiatore (le rotazioni restano riferite al primo, P1). Cliccando **O** si torna al modulo con un solo palleggiatore.
- **Falli di posizione**: in ricezione, un overlay mostra la zona di rotazione di ogni giocatore e con chi può fare fallo di posizione; scegliendo un giocatore (in campo o dai pulsanti sotto il campo) si vedono solo i suoi possibili falli, con frecce e spiegazione (es. "deve avere C2 alla sua sinistra"), e "Tutta la formazione" torna alla vista completa. Se c'è un fallo compare un avviso, anche nell'editor mentre si spostano i giocatori. Regolamento FIVB 2025-2028: vale solo per la squadra in ricezione.
- **Competenze di ricezione**: nella fase Ricezione il campo si divide in una zona colorata per ogni ricevitore, con una fascia più scura lungo i confini che indica chi prende la palla che cade lì (lati sinistra/destra/avanti/dietro dal punto di vista del giocatore). Con "Modifica" si trascinano i vertici condivisi, si aggiungono vertici con il "+" e si eliminano con il doppio clic, si danno o tolgono zone ai giocatori; i conflitti (nessuno o entrambi competenti su un confine) vengono segnalati e le modifiche valgono per lo schema solo con "Salva". Falli di posizione e competenze sono due schede del pannello sotto il campo.
- **Note**: un commento per ogni rotazione e fase, riportato anche negli export.
- **Export**: PNG, PDF (pagina singola o sequenza) e video animato (`.webm`, o `.mp4` su Safari), con la possibilità di includere falli di posizione e competenze di ricezione. Dallo stesso menu si esporta la configurazione dello schema in uso (JSON), competenze comprese.
- **Sostieni lo sviluppo**: nella pagina Info, una donazione volontaria tramite PayPal (facoltativa, non sblocca nulla); l'app la ricorda solo negli avvisi di aggiornamento.
- **Installabile come app (PWA)**: dal browser si può installare l'app sulla schermata Home (su iPhone/iPad: Safari → Condividi → "Visualizza altro" → "Aggiungi alla schermata Home"; su Android: Chrome → menu ⋮ → "Installa app"). Funziona anche senza connessione.
- **App desktop e Android**: gli installer per Windows (`.exe`/`.msi`), macOS (`.dmg`), Linux (`.AppImage`/`.deb`/`.rpm`) e Android (`.apk`) sono allegati a ogni [release](https://github.com/napo/rotazionivolley/releases/latest) e linkati dalla pagina Info della versione web.
- **Aggiornamenti**: la versione web/PWA scarica le nuove versioni da sola e propone "Aggiorna ora"; le app desktop/Android segnalano quando c'è una versione più recente (su desktop si installa in-app con un clic), e il controllo si può disattivare dalla pagina Info.

![](https://raw.githubusercontent.com/napo/rotazionivolley/master/demo/rotazionivolley.gif)

## Licenza

Il software è distribuito con licenza [GNU Affero General Public License v3.0 or later](LICENSE) (SPDX `AGPL-3.0-or-later`): puoi usarlo, studiarlo, modificarlo e ridistribuirlo, anche in versione modificata, a condizione di rilasciare con la stessa licenza il codice sorgente delle modifiche. La condizione vale anche quando una versione modificata viene resa disponibile agli utenti attraverso una rete, per esempio come sito web: in quel caso gli utenti devono poter ottenere il codice sorgente. Il software è fornito senza alcuna garanzia.

Fino alla versione 2.2.0 il progetto era distribuito con licenza Apache 2.0; le versioni già pubblicate restano disponibili con quella licenza.

Il progetto nasce da [VBRotations](https://github.com/monkeysppp/VBRotations) di Andy Edwards, distribuito con licenza Apache 2.0: le parti che ne derivano (la versione originale in `index.html`, `js/` e `css/` e le posizioni dei giocatori dello schema di ricezione) conservano l'attribuzione e le condizioni della licenza Apache 2.0, compatibile con la AGPL v3. Snap.svg (`js/snap.svg-min.js`) è distribuito con licenza Apache 2.0. Il logotipo PayPal del pulsante per le donazioni (`web/src/info/paypal.svg`) viene dalle icone di pagamento di [Tabler](https://github.com/tabler/tabler-payments) (licenza MIT) ed è incluso nell'applicazione, non caricato da PayPal; PayPal è un marchio di PayPal, Inc.

