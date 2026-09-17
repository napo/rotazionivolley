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
    'configPicker.addNew': 'Nuovo modulo',

    'comment.title': 'Commento',
    'comment.placeholder': 'Aggiungi una nota per questa rotazione e fase (verrà usata come sottotitolo in PDF e video)…',

    'export.title': 'Esporta',
    'export.format': 'Formato',
    'export.format.png': 'PNG',
    'export.format.pdfSingle': 'PDF (pagina singola)',
    'export.format.pdfPipeline': 'PDF (sequenza / pipeline)',
    'export.format.video': 'Video (sequenza animata, .webm)',
    'export.format.videoUnsupported': ' — non supportato su questo dispositivo',
    'export.sequence.title': 'Sequenza da esportare',
    'export.sequence.phasesForRotation': 'Tutte le fasi della rotazione corrente',
    'export.sequence.rotationsForPhase': 'Tutte le rotazioni della fase corrente',
    'export.sequence.full': 'Sequenza completa (fasi × rotazioni)',
    'export.submit': 'Esporta',
    'export.submitBusy': 'Esportazione…',
    'export.error.generic': 'Esportazione non riuscita',

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
    'editor.action.apply': 'Applica come schema attivo',
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

    'info.title': 'Informazioni',
    'info.close': 'Chiudi',
    'info.project': 'Progetto di',
    'info.builtOn': 'Applicazione costruita su VBRotations di Andy Edwards.',
    'info.sourceLabel': 'Codice sorgente:',
    'info.version': 'Versione {version}',
    'info.licenseLabel': 'Software rilasciato con licenza',

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

    'configPicker.edit': 'Edit {name}',
    'configPicker.addNew': 'New scheme',

    'comment.title': 'Comment',
    'comment.placeholder': 'Add a note for this rotation and phase (used as a subtitle in PDF and video exports)…',

    'export.title': 'Export',
    'export.format': 'Format',
    'export.format.png': 'PNG',
    'export.format.pdfSingle': 'PDF (single page)',
    'export.format.pdfPipeline': 'PDF (sequence / pipeline)',
    'export.format.video': 'Video (animated sequence, .webm)',
    'export.format.videoUnsupported': ' — not supported on this device',
    'export.sequence.title': 'Sequence to export',
    'export.sequence.phasesForRotation': 'All phases of the current rotation',
    'export.sequence.rotationsForPhase': 'All rotations of the current phase',
    'export.sequence.full': 'Full sequence (phases × rotations)',
    'export.submit': 'Export',
    'export.submitBusy': 'Exporting…',
    'export.error.generic': 'Export failed',

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
    'editor.action.apply': 'Apply as active scheme',
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

    'info.title': 'About',
    'info.close': 'Close',
    'info.project': 'Project by',
    'info.builtOn': 'Built on VBRotations by Andy Edwards.',
    'info.sourceLabel': 'Source code:',
    'info.version': 'Version {version}',
    'info.licenseLabel': 'Software released under the',

    'language.label': 'Language',
  },
} as const;

export type StringKey = keyof (typeof strings)['it'];
