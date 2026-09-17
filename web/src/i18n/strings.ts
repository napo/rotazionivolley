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
    'app.footer.basedOn': 'Questa applicazione è basata su',
    'app.footer.by': 'di',
    'app.footer.source': 'Codice sorgente:',
    'app.tutorialButton': 'Tutorial',
    'app.editorButton': 'Editor schemi',
    'app.infoButton': 'Info',

    'rotation.title': 'Rotazione',
    'rotation.ariaLabel': 'Rotazione e fase di gioco',
    'rotation.serve': 'Servizio',
    'rotation.receive': 'Ricezione',

    'phase.ariaLabel': 'Azione di gioco',
    'phase.title': 'Azione',

    'libero.title': 'Libero',
    'libero.none': 'Nessuno',

    'configPicker.label': 'Schema',

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
    'editor.meta.title': 'Dati schema',
    'editor.meta.id': 'ID',
    'editor.meta.name': 'Nome',
    'editor.meta.description': 'Descrizione',
    'editor.hint': 'Seleziona rotazione e fase, poi trascina i giocatori sul campo per modificarne la posizione.',
    'editor.libero.title': 'Libero (posizionamento manuale per questa cella)',
    'editor.libero.add': 'Aggiungi {label} qui',
    'editor.libero.remove': 'Rimuovi {label} da qui',
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
    'info.about.title': 'Il progetto',
    'info.about.body':
      'Rotazioni Volley è uno strumento per visualizzare, modificare ed esportare schemi di rotazione e ricezione nella pallavolo, con supporto per il Libero, commenti ed export in PNG, PDF e video.',
    'info.author.title': 'Autore',
    'info.author.body': 'Maurizio Napolitano',
    'info.source.title': 'Codice sorgente',
    'info.ai.title': 'Sviluppo assistito da AI',
    'info.ai.body':
      "Questo progetto è sviluppato con il supporto di strumenti di intelligenza artificiale (Claude Code di Anthropic), sotto la supervisione e la revisione dell'autore.",

    'language.label': 'Lingua',
  },
  en: {
    'app.title': 'Volleyball reception rotations',
    'app.footer.basedOn': 'This application is based on',
    'app.footer.by': 'by',
    'app.footer.source': 'Source code:',
    'app.tutorialButton': 'Tutorial',
    'app.editorButton': 'Scheme editor',
    'app.infoButton': 'Info',

    'rotation.title': 'Rotation',
    'rotation.ariaLabel': 'Rotation and phase of play',
    'rotation.serve': 'Serve',
    'rotation.receive': 'Receive',

    'phase.ariaLabel': 'Phase of play',
    'phase.title': 'Action',

    'libero.title': 'Libero',
    'libero.none': 'None',

    'configPicker.label': 'Scheme',

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
    'editor.meta.title': 'Scheme details',
    'editor.meta.id': 'ID',
    'editor.meta.name': 'Name',
    'editor.meta.description': 'Description',
    'editor.hint': 'Pick a rotation and phase, then drag players on the court to change their position.',
    'editor.libero.title': 'Libero (manual placement for this cell)',
    'editor.libero.add': 'Add {label} here',
    'editor.libero.remove': 'Remove {label} from here',
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
    'info.about.title': 'The project',
    'info.about.body':
      'Rotazioni Volley is a tool for viewing, editing and exporting volleyball rotation and reception schemes, with Libero support, comments, and PNG/PDF/video export.',
    'info.author.title': 'Author',
    'info.author.body': 'Maurizio Napolitano',
    'info.source.title': 'Source code',
    'info.ai.title': 'AI-assisted development',
    'info.ai.body':
      "This project is developed with the support of AI tools (Anthropic's Claude Code), under the author's supervision and review.",

    'language.label': 'Language',
  },
} as const;

export type StringKey = keyof (typeof strings)['it'];
