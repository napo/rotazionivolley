# rotazioni volley
rappresentazione via web degli schemi di ricezione a 3 nella pallavolo rispetto alla posizione del palleggiatore

Questa applicazione web è la traduzione in italiano del progetto [VBRotations](https://github.com/monkeysppp/VBRotations) di [Andy Edwards](https://github.com/monkeysppp)

l'applicazione può essere usata a questo indirizzo [https://napo.github.io/rotazionivolley/](https://napo.github.io/rotazionivolley/)


## Cosa si può fare

- **Rotazioni e fasi**: naviga le sei rotazioni (in ricezione e in battuta) e le fasi di gioco, con i giocatori che si muovono in campo in modo animato.
- **Editor degli schemi**: crea un nuovo modulo partendo da uno esistente (o importando un JSON), trascina i giocatori nelle posizioni volute per ogni rotazione e fase, scegli quando entra il libero, aggiungi note e salva. Gli schemi restano sul tuo dispositivo (nel browser o nell'app), non sul server centrale: si possono modificare, cancellare e scaricare come JSON. Per condividerli basta inviare il file JSON, che chi lo riceve può importare dall'editor.
- **Due palleggiatori**: nell'editor il bollo **P2** trasforma l'opposto in un secondo palleggiatore (le rotazioni restano riferite al primo, P1). Cliccando **O** si torna al modulo con un solo palleggiatore.
- **Falli di posizione**: in ricezione, un overlay mostra la zona di rotazione di ogni giocatore e con chi può fare fallo di posizione; scegliendo un giocatore (in campo o dai pulsanti sotto il campo) si vedono solo i suoi possibili falli, con frecce e spiegazione (es. "deve avere C2 alla sua sinistra"), e "Tutta la formazione" torna alla vista completa. Se c'è un fallo compare un avviso, anche nell'editor mentre si spostano i giocatori. Regolamento FIVB 2025-2028: vale solo per la squadra in ricezione.
- **Note**: un commento per ogni rotazione e fase, riportato anche negli export.
- **Export**: PNG, PDF (pagina singola o sequenza) e video animato (`.webm`, o `.mp4` su Safari).
- **Sostieni lo sviluppo**: nella pagina Info, una donazione volontaria tramite PayPal (facoltativa, non sblocca nulla); l'app la ricorda solo negli avvisi di aggiornamento.
- **Installabile come app (PWA)**: dal browser si può installare l'app sulla schermata Home (su iPhone/iPad: Safari → Condividi → "Aggiungi alla schermata Home"). Funziona anche senza connessione.
- **Aggiornamenti**: la versione web/PWA scarica le nuove versioni da sola e propone "Aggiorna ora"; le app desktop/Android segnalano quando c'è una versione più recente (su desktop si installa in-app con un clic), e il controllo si può disattivare dalla pagina Info.

![](https://raw.githubusercontent.com/napo/rotazionivolley/master/demo/rotazionivolley.gif)
