import { useState } from 'react';
import type { FormationConfig, SetterPosition } from '../configs/schema';
import type { Team } from '../state/AppStateContext';
import { useI18n } from '../i18n/I18nContext';
import type { StringKey } from '../i18n/strings';
import { exportStateAsPng } from './png';
import { buildPipelinePages, exportPipelinePdf, exportSinglePagePdf, type PipelineSequenceKind } from './pdf';
import { isVideoExportSupported, recordSequenceAsWebm } from './video';
import './export.css';

interface ExportMenuProps {
  config: FormationConfig;
  team: Team;
  phaseKey: string;
  setterPosition: SetterPosition;
  activeLiberoId?: string | null;
}

type Format = 'png' | 'pdf-single' | 'pdf-pipeline' | 'video';

const SEQUENCE_LABEL_KEYS: Record<PipelineSequenceKind, StringKey> = {
  phasesForRotation: 'export.sequence.phasesForRotation',
  rotationsForPhase: 'export.sequence.rotationsForPhase',
  full: 'export.sequence.full',
};

const videoSupported = isVideoExportSupported();

export function ExportMenu({ config, team, phaseKey, setterPosition, activeLiberoId = null }: ExportMenuProps) {
  const { t } = useI18n();
  const [format, setFormat] = useState<Format>('png');
  const [sequence, setSequence] = useState<PipelineSequenceKind>('phasesForRotation');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usesSequence = format === 'pdf-pipeline' || format === 'video';

  async function handleExport() {
    setBusy(true);
    setError(null);
    try {
      const base = `${config.id}-p${setterPosition}-${phaseKey}`;
      if (format === 'png') {
        await exportStateAsPng(config, phaseKey, setterPosition, `${base}.png`, activeLiberoId);
      } else if (format === 'pdf-single') {
        await exportSinglePagePdf(config, phaseKey, setterPosition, `${base}.pdf`, activeLiberoId);
      } else if (format === 'pdf-pipeline') {
        const pages = buildPipelinePages(config, { team, phaseKey, setterPosition }, sequence);
        await exportPipelinePdf(config, pages, `${config.id}-sequenza-${sequence}.pdf`, activeLiberoId);
      } else {
        const pages = buildPipelinePages(config, { team, phaseKey, setterPosition }, sequence);
        await recordSequenceAsWebm(config, pages, `${config.id}-sequenza-${sequence}.webm`, activeLiberoId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('export.error.generic'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel export-menu" aria-label={t('export.title')}>
      <h2 className="panel__title">{t('export.title')}</h2>

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
          {(Object.keys(SEQUENCE_LABEL_KEYS) as PipelineSequenceKind[]).map((kind) => (
            <label key={kind}>
              <input
                type="radio"
                name="export-sequence"
                checked={sequence === kind}
                onChange={() => setSequence(kind)}
              />
              {t(SEQUENCE_LABEL_KEYS[kind])}
            </label>
          ))}
        </fieldset>
      )}

      <button type="button" className="export-menu__submit" onClick={handleExport} disabled={busy}>
        {busy ? t('export.submitBusy') : t('export.submit')}
      </button>
      {error && (
        <p role="alert" className="export-menu__error">
          {error}
        </p>
      )}
    </section>
  );
}
