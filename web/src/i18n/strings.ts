export type Lang = 'it' | 'en';

/**
 * UI chrome translations (buttons, panel titles, hints, tutorial, info).
 * Formation config content (player/phase labels, schema name/description) is
 * data, not UI, and stays as authored in the JSON — translating that would
 * need a schema change (per-field language maps), out of scope for now.
 */
export const strings = {
  it: {
    'app.title': 'Rotazioni di ricezione nella pallavolo',
    'app.tutorialButton': 'Tutorial',
    'app.infoButton': 'Info',

    'rotation.title': 'Rotazione',
    'rotation.ariaLabel': 'Rotazione e fase di gioco',
    'rotation.serve': 'Servizio',
    'rotation.receive': 'Ricezione',

    'phase.ariaLabel': 'Azione di gioco',
    'phase.title': 'Azione',

    'configPicker.edit': 'Modifica {name}',
    'configPicker.delete': 'Cancella {name}',
    'configPicker.addNew': 'Nuovo modulo',

    'comment.title': 'Commento',
    'comment.placeholder': 'Aggiungi una nota per questa rotazione e fase (verrà usata come sottotitolo in PDF e video)…',

    'faults.title': 'Falli di posizione',
    'faults.hint':
      'Il numero accanto a ogni giocatore è la sua zona di rotazione. Scegli un giocatore (qui sopra o cliccandolo in campo) per vedere solo i suoi possibili falli; "Tutta la formazione" torna alla vista completa.',
    'faults.rule':
      'Si confrontano solo le zone adiacenti: 4-5, 3-6, 2-1 (avanti/dietro) e 4-3-2, 5-6-1 (sinistra/destra). In campo contano i piedi; qui si usa il centro del bollino.',
    'faults.summaryOk': 'Nessun fallo di posizione in questa formazione.',
    'faults.summaryOne': '1 fallo di posizione',
    'faults.summaryMany': '{count} falli di posizione',
    'faults.pairFrontBack': '{first} (zona {firstZone}) deve stare più vicino alla rete di {second} (zona {secondZone})',
    'faults.pairLeftRight': '{first} (zona {firstZone}) deve stare più a sinistra di {second} (zona {secondZone})',
    'faults.playerHeading': '{player} — zona {zone}',
    'faults.needsBehind': 'deve avere {other} (zona {zone}) dietro di sé, più lontano dalla rete',
    'faults.needsInFront': 'deve avere {other} (zona {zone}) davanti a sé, più vicino alla rete',
    'faults.needsLeft': 'deve avere {other} (zona {zone}) alla sua sinistra',
    'faults.needsRight': 'deve avere {other} (zona {zone}) alla sua destra',
    'faults.faultNow': 'ora è fallo',
    'faults.viewLabel': 'Vista dei falli di posizione',
    'faults.viewAll': 'Tutta la formazione',
    'faults.viewPlayer': 'Solo i possibili falli di {player} (zona {zone})',
    'faults.editorAlert': 'Attenzione: in questa formazione di ricezione ci sono falli di posizione:',

    'tools.ariaLabel': 'Strumenti per la formazione di ricezione',
    'tools.hint': 'Scegli una scheda per vederla disegnata sul campo; un nuovo clic la chiude.',

    'zones.title': 'Competenze di ricezione',
    'zones.edit': 'Modifica',
    'zones.editDone': 'Fine',
    'zones.colour': 'Colore della zona di {player}',
    'zones.sidesLabel': 'Lati di competenza di {player}',
    'zones.side.left': 'Sinistra',
    'zones.side.right': 'Destra',
    'zones.side.front': 'Avanti',
    'zones.side.back': 'Dietro',
    'zones.borderOwner': 'tra {a} e {b}: palla di {owner}',
    'zones.borderNobody': 'tra {a} e {b}: nessuno ha la competenza',
    'zones.borderBoth': 'tra {a} e {b}: la rivendicano entrambi',
    'zones.remove': 'Togli la zona di {player}',
    'zones.addLabel': 'Dai una zona a:',
    'zones.add': 'Dai una zona a {player}',
    'zones.editHint':
      'Trascina i vertici bianchi: i confini condivisi si spostano insieme a tutte le zone che li toccano. Il "+" su un confine aggiunge un vertice da spostare; un vertice lasciato sopra un altro si unisce a lui (quello di arrivo si cerchia di verde); il doppio clic su un vertice lo elimina. Aggiungere o togliere una zona ricalcola le aree dalle posizioni dei giocatori. Le modifiche valgono per lo schema solo quando premi "Salva".',
    'zones.hint':
      'Ogni colore è la zona di un ricevitore; la fascia più scura lungo un confine indica chi prende la palla che cade lì. I lati sono dal punto di vista del giocatore, rivolto verso la rete.',
    'zones.reset': 'Ripristina le zone di partenza',
    'zones.save': 'Salva',
    'zones.discard': 'Annulla',
    'zones.unsaved': 'Modifiche non ancora salvate nello schema.',
    'zones.unsavedConfirm':
      'Ci sono modifiche non salvate alle competenze di ricezione di P{position}.\n\nOK: salvale nello schema in uso.\nAnnulla: scartale.',
    'zones.removeVertex.title': 'Eliminare il punto?',
    'zones.removeVertex.text': 'Il punto viene tolto e il confine torna dritto tra i due punti vicini.',
    'zones.removeVertex.fixed':
      'Questo punto non si può eliminare: unisce tre o più zone, oppure è dove un confine incontra il bordo del campo. Si può solo spostare.',
    'zones.removeVertex.dontAsk': 'Non chiederlo più (si riattiva dalla pagina Info)',
    'zones.removeVertex.cancel': 'Annulla',
    'zones.removeVertex.confirm': 'Elimina',
    'zones.removeVertex.ok': 'Ho capito',

    'export.title': 'Esporta',
    'export.format': 'Formato',
    'export.format.png': 'PNG',
    'export.format.pdfSingle': 'PDF (pagina singola)',
    'export.format.pdfPipeline': 'PDF (sequenza / pipeline)',
    'export.format.video': 'Video (sequenza animata)',
    'export.format.videoUnsupported': ' — non supportato su questo dispositivo',
    'export.sequence.title': 'Sequenza da esportare',
    'export.sequence.serveRotation': 'Servizio rotazione P{position}',
    'export.sequence.receiveRotation': 'Ricezione rotazione P{position}',
    'export.sequence.full': 'Tutte le fasi',
    'export.submit': 'Esporta',
    'export.config.title': 'Configurazione',
    'export.config.button': 'Esporta la configurazione (JSON)',
    'export.config.note':
      'Lo schema in uso con tutte le sue modifiche (competenze di ricezione comprese), da condividere o reimportare dall\'editor.',
    'export.submitBusy': 'Esportazione…',
    'export.error.generic': 'Esportazione non riuscita',
    'export.saved': "Salvato nei Documenti dell'app. Puoi anche condividerlo da lì.",
    'export.shareReady': 'Il file è pronto.',
    'export.shareSave': 'Salva o condividi',
    'export.faults.all': 'Falli di posizione: tutta la squadra',
    'export.faults.player': 'Falli di posizione: {player} (zona {zone})',
    'export.faults.none': 'nessun fallo',
    'export.include.title': 'Includi',
    'export.include.faults': 'Falli di posizione: tutta la squadra, poi un giocatore alla volta',
    'export.include.zones': 'Competenze di ricezione',
    'export.include.note': 'Si aggiungono dopo ogni formazione di ricezione della sequenza.',
    'export.screenNote': 'Si esporta quello che vedi sul campo, compresi: {items}.',
    'export.header.rotation': '{team} situazione P{position}',

    'editor.title': 'Editor schemi',
    'editor.back': '← Torna alla visualizzazione',
    'editor.baseOn': 'Basa il nuovo schema su',
    'editor.start': 'Inizia da questo schema',
    'editor.or': 'oppure',
    'editor.import': 'Importa un file JSON esportato in precedenza',
    'editor.importError.invalidJson': 'Il file non è un JSON valido',
    'editor.meta.name': 'Nome',
    'editor.meta.description': 'Descrizione',
    'editor.hint': 'Seleziona rotazione e fase, poi trascina i giocatori sul campo per modificarne la posizione.',
    'editor.libero.title': 'Libero',
    'editor.libero.hint':
      'Clicca L1 o L2 (fuori campo, a sinistra), poi un giocatore in seconda linea sul campo: entreranno al suo posto, scambiandosi di posizione. La scelta vale per tutta la sequenza (fino a "Cambio" incluso) e si può cambiare di nuovo solo qui, in "Base".',
    'editor.libero.lockedHint':
      'Il libero si sceglie solo nella fase "Base": da lì vale per tutta la sequenza, fino a "Cambio" incluso. Torna a "Base" per cambiarlo.',
    'editor.action.apply': 'Salva',
    'editor.action.delete': 'Cancella',
    'editor.deleteConfirm': 'Cancellare lo schema "{name}"?',
    'editor.secondSetter.badge': 'P2',
    'editor.singleSetter.badge': 'O',
    'editor.singleSetter.hint': 'Abilita questo se vuoi giocare con un modulo con un solo palleggiatore.',
    'editor.secondSetter.hint':
      'Abilita questo se vuoi giocare con un modulo con due palleggiatori. Le rotazioni useranno come riferimento il primo palleggiatore, pertanto rimangono P1... P6',
    'editor.action.download': 'Scarica JSON',
    'editor.action.restart': 'Ricomincia',

    'tutorial.close': 'Chiudi',
    'tutorial.next': 'Avanti',
    'tutorial.finish': 'Fine',
    'tutorial.step1':
      'Questo è un giocatore.\nSi seleziona con un clic.\nS = Schiacciatore, C = Centrale,\nP = Palleggiatore, O = Opposto',
    'tutorial.step2':
      'Questo è il campo con tutti\ne 6 i giocatori.\nAi clic sui controlli, i giocatori\nsi muoveranno intorno al campo.',
    'tutorial.step3':
      "Questo ti permette di scegliere\nla formazione di partenza.\nOgni riga è etichettata con la\nposizione dell'alzatore (P1-P6).",
    'tutorial.step4': 'Questa colonna mostra la situazione\nin cui la squadra è al servizio.',
    'tutorial.step5': 'Questa colonna mostra la situazione\nin cui la squadra è in ricezione.',
    'tutorial.step6':
      'Da qui si selezionano le situazioni\ndi gioco (base, servizio, ricezione,\nalzata, attacco, cambio).\nI giocatori si muoveranno nel\ncampo di conseguenza.',
    'tutorial.step7':
      'Nella fase Ricezione di una rotazione\nin ricezione, la scheda\n"Falli di posizione" disegna zone e\ncoppie da rispettare.\nScegli un giocatore per vedere solo\ni suoi possibili falli, oppure\n"Tutta la formazione".\nSe c\'è un fallo la scheda mostra\nun bollino rosso.\nLa scheda "Competenze di ricezione"\nmostra chi copre quale zona.',

    'info.title': 'Informazioni',
    'info.close': 'Chiudi',
    'info.back': '← Torna alle rotazioni',
    'info.about': 'Il progetto',
    'info.preferences': 'Preferenze',
    'info.zonesConfirmRemoval': 'Chiedi conferma prima di eliminare un punto delle competenze di ricezione',
    'info.install': "Installa l'app",
    'info.project': 'Progetto di',
    'info.builtOn': 'Applicazione costruita su VBRotations di Andy Edwards (licenza Apache 2.0).',
    'info.sourceLabel': 'Codice sorgente:',
    'info.aiAssisted': "Realizzato con l'aiuto di Claude AI.",
    'info.version': 'Versione {version}',
    'info.licenseLabel': 'Software rilasciato con licenza',
    'info.downloads.intro':
      'Se vuoi provare rotazionivolley sul tuo computer o sul tuo smartphone/tablet, scarica la versione {version} per il tuo sistema:',
    'info.downloads.allReleases': 'Tutte le versioni e le note di rilascio:',
    'info.androidInstallHint':
      "Su Android puoi anche installare l'app direttamente dal browser, senza APK: in Chrome apri il menu ⋮ e scegli \"Installa app\" (o \"Aggiungi a schermata Home\"). Funziona anche senza connessione e si aggiorna da sola.",
    'info.downloads.macNotarizationNote':
      'macOS: la versione per Mac non è firmata con un account Apple Developer (a pagamento). Al primo avvio, se macOS la blocca, autorizzala da Preferenze di Sistema → Privacy e sicurezza → "Apri comunque".',
    'info.schemesLocal':
      'Gli schemi che crei con l\'editor restano su questo dispositivo (nel browser o nell\'app), non sul server centrale. Per condividerli usa "Scarica JSON" e invia il file: chi lo riceve può importarlo dall\'editor.',
    'info.downloads.androidSideloadNote':
      "Android: l'APK non è distribuito tramite il Play Store, quindi per installarlo devi abilitare \"Installa da fonti sconosciute\" per il browser o l'app che usi per scaricarlo.",


    'update.available': 'È disponibile la versione {version} (tu hai la {current}).',
    'update.download': 'Scarica',
    'update.later': 'Più tardi',
    'update.updated': 'Rotazioni Volley è stato aggiornato alla versione {version}.',
    'update.support': "Se l'app ti è utile, puoi sostenerne lo sviluppo con una donazione.",
    'update.donate': 'Fai una donazione',
    'update.close': 'Chiudi',
    'update.updateNow': 'Aggiorna ora',
    'update.downloading': 'Download in corso…',
    'update.progress': 'Download: {percent}%',
    'update.installing': 'Installazione in corso…',
    'update.failed': "Aggiornamento non riuscito.",
    'update.pwaAvailable': "È disponibile una nuova versione dell'app.",
    'support.title': 'Sostieni lo sviluppo',
    'support.openSource': 'Rotazioni Volley è sviluppato e mantenuto come progetto open source.',
    'support.invite':
      'Se lo trovi utile e vuoi contribuire alle spese e al tempo necessario per continuare a svilupparlo, puoi fare una donazione volontaria tramite PayPal.',
    'support.button': 'Sostieni Rotazioni Volley con PayPal',
    'support.note':
      'La donazione è completamente facoltativa e non sblocca funzionalità aggiuntive. Il link apre il sito di PayPal: finché non lo scegli, questa pagina non contatta PayPal.',
    'update.iosInstallHint':
      "Puoi installare l'app su iPhone/iPad: in Safari tocca Condividi, poi \"Visualizza altro\" (la freccia in basso) e scegli \"Aggiungi alla schermata Home\". Funziona anche senza connessione e si aggiorna da sola.",
    'info.updatesCheck': "Controlla gli aggiornamenti all'avvio",

    'language.label': 'Lingua',
  },
  en: {
    'app.title': 'Volleyball reception rotations',
    'app.tutorialButton': 'Tutorial',
    'app.infoButton': 'Info',

    'rotation.title': 'Rotation',
    'rotation.ariaLabel': 'Rotation and phase of play',
    'rotation.serve': 'Serve',
    'rotation.receive': 'Receive',

    'phase.ariaLabel': 'Phase of play',
    'phase.title': 'Action',

    'faults.title': 'Positional faults',
    'faults.hint':
      'The number next to each player is their rotational zone. Pick a player (above, or by clicking them on court) to see only their possible faults; "Whole formation" goes back to the full view.',
    'faults.rule':
      'Only adjacent zones are compared: 4-5, 3-6, 2-1 (front/back) and 4-3-2, 5-6-1 (left/right). On court the feet count; here the marker centre is used.',
    'faults.summaryOk': 'No positional faults in this formation.',
    'faults.summaryOne': '1 positional fault',
    'faults.summaryMany': '{count} positional faults',
    'faults.pairFrontBack': '{first} (zone {firstZone}) must be closer to the net than {second} (zone {secondZone})',
    'faults.pairLeftRight': '{first} (zone {firstZone}) must be further left than {second} (zone {secondZone})',
    'faults.playerHeading': '{player} — zone {zone}',
    'faults.needsBehind': 'must have {other} (zone {zone}) behind, further from the net',
    'faults.needsInFront': 'must have {other} (zone {zone}) in front, closer to the net',
    'faults.needsLeft': 'must have {other} (zone {zone}) on their left',
    'faults.needsRight': 'must have {other} (zone {zone}) on their right',
    'faults.faultNow': 'fault now',
    'faults.viewLabel': 'Positional fault view',
    'faults.viewAll': 'Whole formation',
    'faults.viewPlayer': 'Only the possible faults of {player} (zone {zone})',
    'faults.editorAlert': 'Warning: this receive formation has positional faults:',

    'tools.ariaLabel': 'Receive formation tools',
    'tools.hint': 'Pick a tab to see it drawn on the court; click it again to close it.',

    'zones.title': 'Reception responsibilities',
    'zones.edit': 'Edit',
    'zones.editDone': 'Done',
    'zones.colour': "Colour of {player}'s zone",
    'zones.sidesLabel': "{player}'s responsibility sides",
    'zones.side.left': 'Left',
    'zones.side.right': 'Right',
    'zones.side.front': 'Front',
    'zones.side.back': 'Back',
    'zones.borderOwner': 'between {a} and {b}: {owner} takes it',
    'zones.borderNobody': 'between {a} and {b}: nobody is responsible',
    'zones.borderBoth': 'between {a} and {b}: both claim it',
    'zones.remove': "Remove {player}'s zone",
    'zones.addLabel': 'Give a zone to:',
    'zones.add': 'Give a zone to {player}',
    'zones.editHint':
      "Drag the white vertices: shared borders move together with every zone touching them. The \"+\" on a border adds a vertex to drag; a vertex dropped on another merges into it (the one it lands on gets a green ring); double-clicking a vertex deletes it. Adding or removing a zone recomputes the areas from the players' positions. Changes apply to the scheme only when you press \"Save\".",
    'zones.hint':
      "Each colour is one receiver's zone; the darker band along a border shows who takes the ball landing there. Sides are from the player's point of view, facing the net.",
    'zones.reset': 'Reset to the starting zones',
    'zones.save': 'Save',
    'zones.discard': 'Cancel',
    'zones.unsaved': 'Changes not saved to the scheme yet.',
    'zones.unsavedConfirm':
      'There are unsaved changes to the reception responsibilities of P{position}.\n\nOK: save them to the scheme in use.\nCancel: discard them.',
    'zones.removeVertex.title': 'Delete this point?',
    'zones.removeVertex.text': 'The point is removed and the border runs straight between its two neighbours again.',
    'zones.removeVertex.fixed':
      "This point can't be deleted: it joins three or more zones, or it's where a border meets the edge of the court. It can only be moved.",
    'zones.removeVertex.dontAsk': "Don't ask again (turn it back on from the Info page)",
    'zones.removeVertex.cancel': 'Cancel',
    'zones.removeVertex.confirm': 'Delete',
    'zones.removeVertex.ok': 'Got it',

    'configPicker.edit': 'Edit {name}',
    'configPicker.delete': 'Delete {name}',
    'configPicker.addNew': 'New scheme',

    'comment.title': 'Comment',
    'comment.placeholder': 'Add a note for this rotation and phase (used as a subtitle in PDF and video exports)…',

    'export.title': 'Export',
    'export.format': 'Format',
    'export.format.png': 'PNG',
    'export.format.pdfSingle': 'PDF (single page)',
    'export.format.pdfPipeline': 'PDF (sequence / pipeline)',
    'export.format.video': 'Video (animated sequence)',
    'export.format.videoUnsupported': ' — not supported on this device',
    'export.sequence.title': 'Sequence to export',
    'export.sequence.serveRotation': 'Serve rotation P{position}',
    'export.sequence.receiveRotation': 'Receive rotation P{position}',
    'export.sequence.full': 'All phases',
    'export.submit': 'Export',
    'export.config.title': 'Configuration',
    'export.config.button': 'Export the configuration (JSON)',
    'export.config.note':
      'The scheme in use with all its changes (reception responsibilities included), to share or import again from the editor.',
    'export.submitBusy': 'Exporting…',
    'export.error.generic': 'Export failed',
    'export.saved': "Saved to the app's Documents. You can also share it from there.",
    'export.shareReady': 'The file is ready.',
    'export.shareSave': 'Save or share',
    'export.faults.all': 'Positional faults: whole team',
    'export.faults.player': 'Positional faults: {player} (zone {zone})',
    'export.faults.none': 'no faults',
    'export.include.title': 'Include',
    'export.include.faults': 'Positional faults: whole team, then one player at a time',
    'export.include.zones': 'Reception responsibilities',
    'export.include.note': 'Added after each receive formation of the sequence.',
    'export.screenNote': 'What you see on the court is exported, including: {items}.',
    'export.header.rotation': '{team} situation P{position}',

    'editor.title': 'Scheme editor',
    'editor.back': '← Back to viewer',
    'editor.baseOn': 'Base the new scheme on',
    'editor.start': 'Start from this scheme',
    'editor.or': 'or',
    'editor.import': 'Import a previously exported JSON file',
    'editor.importError.invalidJson': 'The file is not valid JSON',
    'editor.meta.name': 'Name',
    'editor.meta.description': 'Description',
    'editor.hint': 'Pick a rotation and phase, then drag players on the court to change their position.',
    'editor.libero.title': 'Libero',
    'editor.libero.hint':
      'Click L1 or L2 (off court, on the left), then a back-row player on court: they swap places, and the libero comes on. This choice holds for the whole sequence (through "Switch"), and can only be changed again here, on "Base".',
    'editor.libero.lockedHint':
      'The libero is only chosen on the "Base" phase — from there it holds for the whole sequence, through "Switch". Go back to "Base" to change it.',
    'editor.action.apply': 'Save',
    'editor.action.delete': 'Delete',
    'editor.deleteConfirm': 'Delete the scheme "{name}"?',
    'editor.secondSetter.badge': 'P2',
    'editor.singleSetter.badge': 'O',
    'editor.singleSetter.hint': 'Enable this to play a system with a single setter.',
    'editor.secondSetter.hint':
      'Enable this to play a system with two setters. Rotations use the first setter as reference, so they stay P1... P6',
    'editor.action.download': 'Download JSON',
    'editor.action.restart': 'Start over',

    'tutorial.close': 'Close',
    'tutorial.next': 'Next',
    'tutorial.finish': 'Done',
    'tutorial.step1':
      'This is a player.\nClick it to select it.\nS = Hitter, C = Middle,\nP = Setter, O = Opposite',
    'tutorial.step2':
      'This is the court with all\n6 players. Clicking the controls\nmoves the players around the court.',
    'tutorial.step3':
      "This lets you choose the starting\nformation. Each row is labelled\nwith the setter's position (P1-P6).",
    'tutorial.step4': 'This column shows the formation\nwhen the team is serving.',
    'tutorial.step5': 'This column shows the formation\nwhen the team is receiving.',
    'tutorial.step6':
      'From here you pick the phase of\nplay (base, serve, receive, set,\nattack, switch). Players move on\nthe court accordingly.',
    'tutorial.step7':
      'In the Receive phase of a receive\nrotation, the "Positional faults"\ntab draws the zones and pairs\nto respect.\nPick a player to see only their\npossible faults, or\n"Whole formation".\nOn any fault the tab shows a red badge.\nThe "Reception responsibilities"\ntab shows who covers which zone.',

    'info.title': 'About',
    'info.close': 'Close',
    'info.back': '← Back to the rotations',
    'info.about': 'The project',
    'info.preferences': 'Preferences',
    'info.zonesConfirmRemoval': 'Ask before deleting a point of the reception responsibilities',
    'info.install': 'Install the app',
    'info.project': 'Project by',
    'info.builtOn': 'Built on VBRotations by Andy Edwards (Apache License 2.0).',
    'info.sourceLabel': 'Source code:',
    'info.aiAssisted': 'Built with the help of Claude AI.',
    'info.version': 'Version {version}',
    'info.licenseLabel': 'Software released under the',
    'info.downloads.intro':
      'If you want to try rotazionivolley on your computer or your smartphone/tablet, download version {version} for your system:',
    'info.downloads.allReleases': 'All versions and release notes:',
    'info.androidInstallHint':
      'On Android you can also install the app straight from the browser, no APK needed: in Chrome open the ⋮ menu and choose "Install app" (or "Add to Home screen"). It also works offline and updates itself.',
    'info.downloads.macNotarizationNote':
      'macOS: the Mac build isn\'t signed with a (paid) Apple Developer account. If macOS blocks it on first launch, allow it from System Settings → Privacy & Security → "Open Anyway".',
    'info.schemesLocal':
      'The schemes you create with the editor stay on this device (in the browser or app), not on a central server. To share them, use "Download JSON" and send the file: whoever receives it can import it from the editor.',
    'info.downloads.androidSideloadNote':
      'Android: the APK isn\'t distributed through the Play Store, so installing it requires enabling "Install from unknown sources" for the browser or app you use to download it.',


    'update.available': 'Version {version} is available (you have {current}).',
    'update.download': 'Download',
    'update.later': 'Later',
    'update.updated': 'Rotazioni Volley was updated to version {version}.',
    'update.support': 'If you find the app useful, you can support its development with a donation.',
    'update.donate': 'Make a donation',
    'update.close': 'Close',
    'update.updateNow': 'Update now',
    'update.downloading': 'Downloading…',
    'update.progress': 'Downloading: {percent}%',
    'update.installing': 'Installing…',
    'update.failed': 'Update failed.',
    'update.pwaAvailable': 'A new version of the app is available.',
    'support.title': 'Support development',
    'support.openSource': 'Rotazioni Volley is developed and maintained as an open source project.',
    'support.invite':
      'If you find it useful and want to help with the costs and time needed to keep developing it, you can make a voluntary donation through PayPal.',
    'support.button': 'Support Rotazioni Volley with PayPal',
    'support.note':
      'The donation is entirely optional and does not unlock any extra features. The link opens the PayPal website: until you choose it, this page does not contact PayPal.',
    'update.iosInstallHint':
      'You can install the app on iPhone/iPad: in Safari tap Share, then "View More" (the arrow at the bottom) and pick "Add to Home Screen". It also works offline and updates itself.',
    'info.updatesCheck': 'Check for updates at start',

    'language.label': 'Language',
  },
} as const;

export type StringKey = keyof (typeof strings)['it'];
