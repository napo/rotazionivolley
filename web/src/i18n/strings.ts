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
    'faults.show': 'Mostra',
    'faults.hide': 'Nascondi',
    'faults.unavailableServe':
      'Con il regolamento FIVB 2025-2028 la squadra al servizio può disporsi liberamente: i falli di posizione valgono solo per chi riceve. Seleziona una rotazione in Ricezione.',
    'faults.unavailablePhase': 'Il controllo vale al momento del servizio: disponibile nelle fasi {phases}.',
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
    'faults.alertShowHint': 'premi "Mostra" per vedere dove',
    'faults.viewLabel': 'Vista dei falli di posizione',
    'faults.viewAll': 'Tutta la formazione',
    'faults.viewPlayer': 'Solo i possibili falli di {player} (zona {zone})',
    'faults.editorAlert': 'Attenzione: in questa formazione di ricezione ci sono falli di posizione:',

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
    'export.submitBusy': 'Esportazione…',
    'export.error.generic': 'Esportazione non riuscita',
    'export.saved': "Salvato nei Documenti dell'app. Puoi anche condividerlo da lì.",
    'export.shareReady': 'Il file è pronto.',
    'export.shareSave': 'Salva o condividi',
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
      'Falli di posizione: in ricezione\n(fasi Base e Ricezione) "Mostra"\ndisegna zone e coppie da rispettare.\nScegli un giocatore per vedere solo\ni suoi possibili falli, oppure\n"Tutta la formazione".\nSe c\'è un fallo compare un avviso rosso.',

    'info.title': 'Informazioni',
    'info.close': 'Chiudi',
    'info.project': 'Progetto di',
    'info.builtOn': 'Applicazione costruita su VBRotations di Andy Edwards.',
    'info.sourceLabel': 'Codice sorgente:',
    'info.aiAssisted': "Realizzato con l'aiuto di Claude AI.",
    'info.version': 'Versione {version}',
    'info.licenseLabel': 'Software rilasciato con licenza',
    'info.downloads.intro':
      'Se vuoi provare rotazionivolley sul tuo computer o sul tuo smartphone/tablet, trovi le versioni per Windows, macOS, Linux e Android a questo indirizzo:',
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
      "Puoi installare l'app su iPhone/iPad: in Safari tocca Condividi e poi \"Aggiungi alla schermata Home\". Funziona anche senza connessione e si aggiorna da sola.",
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
    'faults.show': 'Show',
    'faults.hide': 'Hide',
    'faults.unavailableServe':
      'Under the FIVB 2025-2028 rules the serving team may line up freely: positional faults apply only to the receiving team. Pick a Receive rotation.',
    'faults.unavailablePhase': 'The check applies at the service hit: available in the {phases} phases.',
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
    'faults.alertShowHint': 'press "Show" to see where',
    'faults.viewLabel': 'Positional fault view',
    'faults.viewAll': 'Whole formation',
    'faults.viewPlayer': 'Only the possible faults of {player} (zone {zone})',
    'faults.editorAlert': 'Warning: this receive formation has positional faults:',

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
    'export.submitBusy': 'Exporting…',
    'export.error.generic': 'Export failed',
    'export.saved': "Saved to the app's Documents. You can also share it from there.",
    'export.shareReady': 'The file is ready.',
    'export.shareSave': 'Save or share',
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
      'Positional faults: when receiving\n(Base and Receive phases) "Show"\ndraws the zones and pairs to respect.\nPick a player to see only their\npossible faults, or\n"Whole formation".\nA red warning appears on any fault.',

    'info.title': 'About',
    'info.close': 'Close',
    'info.project': 'Project by',
    'info.builtOn': 'Built on VBRotations by Andy Edwards.',
    'info.sourceLabel': 'Source code:',
    'info.aiAssisted': 'Built with the help of Claude AI.',
    'info.version': 'Version {version}',
    'info.licenseLabel': 'Software released under the',
    'info.downloads.intro':
      'If you want to try rotazionivolley on your computer or your smartphone/tablet, you\'ll find the Windows, macOS, Linux and Android versions at this address:',
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
      'You can install the app on iPhone/iPad: in Safari tap Share, then "Add to Home Screen". It also works offline and updates itself.',
    'info.updatesCheck': 'Check for updates at start',

    'language.label': 'Language',
  },
} as const;

export type StringKey = keyof (typeof strings)['it'];
