import { useState } from 'react';
import type { FormationConfig, SetterPosition } from '../configs/schema';
import type { Team } from '../state/AppStateContext';
import { useI18n } from '../i18n/I18nContext';
import { exportStateAsPng } from './png';
import { buildPipelinePages, exportPipelinePdf, exportSinglePagePdf, type PipelineSequenceKind } from './pdf';
import type { Translate } from './sequence';
import { isVideoExportSupported, recordSequenceAsVideo } from './video';
import type { SaveOutcome } from './platformSave';
import './export.css';

interface ExportMenuProps {
  config: FormationConfig;
  team: Team;
  phaseKey: string;
  setterPosition: SetterPosition;
  activeLiberoId?: string | null;
  /** When embedded in a dropdown (e.g. the header), skip the panel chrome and title — the trigger button already labels it. */
  embedded?: boolean;
}

type Format = 'png' | 'pdf-single' | 'pdf-pipeline' | 'video';

const SEQUENCE_KINDS: PipelineSequenceKind[] = ['serveRotation', 'receiveRotation', 'full'];

/**
 * Names the actual rotation this choice would export (e.g. "Servizio
 * rotazione P1"), reading the rotation (Px) straight off what's currently
 * selected on screen — so switching rotation changes what these say, and
 * picking one doesn't require remembering what's currently selected.
 */
function sequenceLabel(kind: PipelineSequenceKind, t: Translate, setterPosition: SetterPosition): string {
  if (kind === 'serveRotation') {
    return t('export.sequence.serveRotation', { position: setterPosition });
  }
  if (kind === 'receiveRotation') {
    return t('export.sequence.receiveRotation', { position: setterPosition });
  }
  return t('export.sequence.full');
}

const videoSupported = isVideoExportSupported();

export function ExportMenu({ config, team, phaseKey, setterPosition, activeLiberoId = null, embedded = false }: ExportMenuProps) {
  const { t } = useI18n();
  const [format, setFormat] = useState<Format>('png');
  const [sequence, setSequence] = useState<PipelineSequenceKind>('serveRotation');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only ever set on a mobile build (Capacitor): there's no OS "save as"
  // dialog there to confirm the export for the user (see platformSave.ts),
  // so this stands in for it.
  const [savedNote, setSavedNote] = useState(false);
  // iPhone/iPad web build only: the export finished after iOS stopped
  // honouring the original tap, so the share sheet needs a new one.
  const [pendingShare, setPendingShare] = useState<(() => Promise<SaveOutcome>) | null>(null);

  const usesSequence = format === 'pdf-pipeline' || format === 'video';

  async function handleExport() {
    setBusy(true);
    setError(null);
    setSavedNote(false);
    setPendingShare(null);
    try {
      const base = `${config.id}-p${setterPosition}-${phaseKey}`;
      const outcome =
        format === 'png'
          ? await exportStateAsPng(config, team, phaseKey, setterPosition, `${base}.png`, activeLiberoId, t)
          : format === 'pdf-single'
            ? await exportSinglePagePdf(config, team, phaseKey, setterPosition, `${base}.pdf`, activeLiberoId, t)
            : format === 'pdf-pipeline'
              ? await exportPipelinePdf(
                  config,
                  buildPipelinePages(config, { team, phaseKey, setterPosition }, sequence, t),
                  `${config.id}-sequenza-${sequence}.pdf`,
                  activeLiberoId,
                )
              : await recordSequenceAsVideo(
                  config,
                  buildPipelinePages(config, { team, phaseKey, setterPosition }, sequence, t),
                  `${config.id}-sequenza-${sequence}.webm`,
                  activeLiberoId,
                );
      setSavedNote(outcome.kind === 'mobile');
      if (outcome.kind === 'shareReady') setPendingShare(() => outcome.share);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('export.error.generic'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={embedded ? 'export-menu' : 'panel export-menu'} aria-label={t('export.title')}>
      {!embedded && <h2 className="panel__title">{t('export.title')}</h2>}

      <fieldset className="export-menu__group">
        <legend>{t('export.format')}</legend>
        <label>
          <input type="radio" name="export-format" checked={format === 'png'} onChange={() => setFormat('png')} />
          {t('export.format.png')}
        </label>
        <label>
          <input
            type="radio"
            name="export-format"
            checked={format === 'pdf-single'}
            onChange={() => setFormat('pdf-single')}
          />
          {t('export.format.pdfSingle')}
        </label>
        <label>
          <input
            type="radio"
            name="export-format"
            checked={format === 'pdf-pipeline'}
            onChange={() => setFormat('pdf-pipeline')}
          />
          {t('export.format.pdfPipeline')}
        </label>
        <label className={videoSupported ? undefined : 'export-menu__disabled'}>
          <input
            type="radio"
            name="export-format"
            checked={format === 'video'}
            disabled={!videoSupported}
            onChange={() => setFormat('video')}
          />
          {t('export.format.video')}
          {!videoSupported && t('export.format.videoUnsupported')}
        </label>
      </fieldset>

      {usesSequence && (
        <fieldset className="export-menu__group">
          <legend>{t('export.sequence.title')}</legend>
          {SEQUENCE_KINDS.map((kind) => (
            <label key={kind}>
              <input
                type="radio"
                name="export-sequence"
                checked={sequence === kind}
                onChange={() => setSequence(kind)}
              />
              {sequenceLabel(kind, t, setterPosition)}
            </label>
          ))}
        </fieldset>
      )}

      <button type="button" className="export-menu__submit" onClick={handleExport} disabled={busy}>
        {busy ? t('export.submitBusy') : t('export.submit')}
      </button>
      {savedNote && <p className="export-menu__saved">{t('export.saved')}</p>}
      {pendingShare && (
        <p className="export-menu__saved">
          {t('export.shareReady')}{' '}
          <button
            type="button"
            onClick={() => {
              void pendingShare()
                .then((outcome) => setPendingShare(outcome.kind === 'shareReady' ? () => outcome.share : null))
                .catch((err) => setError(err instanceof Error ? err.message : t('export.error.generic')));
            }}
          >
            {t('export.shareSave')}
          </button>
        </p>
      )}
      {error && (
        <p role="alert" className="export-menu__error">
          {error}
        </p>
      )}
    </section>
  );
}
