import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { APP_VERSION } from '../version';
import { isInstalledPwa, isIosDevice, isWebPlatform } from '../platform';
import { isNativeBuild, setUpdateChecksEnabled, updateChecksEnabled } from '../update/updates';
import './info.css';

interface InfoPanelProps {
  onClose: () => void;
}

export function InfoPanel({ onClose }: InfoPanelProps) {
  const { t } = useI18n();
  // Only the plain web build needs pointers to the native installers — a
  // desktop/mobile build is itself one of those installers already.
  const [showDownloads] = useState(isWebPlatform);
  // iPhone/iPad in Safari: there's no native iOS build to download, the
  // app installs from the browser instead (PWA, see vite.config.ts).
  const [showIosInstall] = useState(() => isWebPlatform() && isIosDevice() && !isInstalledPwa());
  // Only the installed apps ever check for updates — see update/updates.ts.
  const [showUpdatesToggle] = useState(isNativeBuild);
  const [checksEnabled, setChecksEnabled] = useState(updateChecksEnabled);

  return (
    <div className="info-overlay" role="dialog" aria-modal="true" aria-label={t('info.title')}>
      <div className="info-overlay__box">
        <div className="info-overlay__header">
          <h2>{t('info.title')}</h2>
          <button type="button" onClick={onClose} aria-label={t('info.close')}>
            ✕
          </button>
        </div>

        <p>
          {t('info.project')}{' '}
          <a href="https://github.com/napo" target="_blank" rel="noreferrer">
            Maurizio Napolitano
          </a>
        </p>
        <p>{t('info.builtOn')}</p>
        <p>
          {t('info.sourceLabel')}{' '}
          <a href="https://github.com/napo/rotazionivolley" target="_blank" rel="noreferrer">
            https://github.com/napo/rotazionivolley
          </a>
        </p>
        <p>{t('info.aiAssisted')}</p>
        <p>{t('info.version', { version: APP_VERSION })}</p>
        <p>
          {t('info.licenseLabel')}{' '}
          <a href="https://github.com/napo/rotazionivolley/blob/master/LICENSE" target="_blank" rel="noreferrer">
            Apache License 2.0
          </a>
        </p>

        <p>{t('info.schemesLocal')}</p>

        {showUpdatesToggle && (
          <p>
            <label>
              <input
                type="checkbox"
                checked={checksEnabled}
                onChange={(e) => {
                  setChecksEnabled(e.target.checked);
                  setUpdateChecksEnabled(e.target.checked);
                }}
              />{' '}
              {t('info.updatesCheck')}
            </label>
          </p>
        )}

        {showIosInstall && <p>{t('update.iosInstallHint')}</p>}

        {showDownloads && (
          <>
            <p>
              {t('info.downloads.intro')}{' '}
              <a href="https://github.com/napo/rotazionivolley/releases" target="_blank" rel="noreferrer">
                GitHub Releases
              </a>
            </p>
            <p className="info-overlay__note">{t('info.downloads.macNotarizationNote')}</p>
            <p className="info-overlay__note">{t('info.downloads.androidSideloadNote')}</p>
          </>
        )}
      </div>
    </div>
  );
}
