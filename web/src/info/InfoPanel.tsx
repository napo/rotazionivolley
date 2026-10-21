import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { APP_VERSION } from '../version';
import { isInstalledPwa, isIosDevice, isWebPlatform } from '../platform';
import { isNativeBuild, setUpdateChecksEnabled, updateChecksEnabled } from '../update/updates';
import { ExternalLink } from '../ExternalLink';
import { PAYPAL_DONATION_URL, SOURCE_REPOSITORY_URL } from '../links';
import paypalLogo from './paypal.svg';
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
          <ExternalLink href="https://github.com/napo">
            Maurizio Napolitano
          </ExternalLink>
        </p>
        <p>{t('info.builtOn')}</p>
        <p>
          {t('info.sourceLabel')}{' '}
          <ExternalLink href={SOURCE_REPOSITORY_URL}>
            {SOURCE_REPOSITORY_URL}
          </ExternalLink>
        </p>
        <p>{t('info.aiAssisted')}</p>
        <p>{t('info.version', { version: APP_VERSION })}</p>
        <p>
          {t('info.licenseLabel')}{' '}
          <ExternalLink href={`${SOURCE_REPOSITORY_URL}/blob/master/LICENSE`}>
            Apache License 2.0
          </ExternalLink>
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
              <ExternalLink href={`${SOURCE_REPOSITORY_URL}/releases`}>
                GitHub Releases
              </ExternalLink>
            </p>
            <p className="info-overlay__note">{t('info.downloads.macNotarizationNote')}</p>
            <p className="info-overlay__note">{t('info.downloads.androidSideloadNote')}</p>
          </>
        )}

        <SupportSection />
      </div>
    </div>
  );
}

/**
 * "Sostieni lo sviluppo": the one place the donation is offered without an
 * update having just happened — informative, never pushy (same wording and
 * stance as the author's analisirefertogara). The PayPal button is a plain
 * link with the wordmark stored in the app: nothing is requested from PayPal
 * until the user opens it.
 */
export function SupportSection() {
  const { t } = useI18n();
  return (
    <section className="info-support" aria-labelledby="info-support-title">
      <h3 id="info-support-title">{t('support.title')}</h3>
      <p>{t('support.openSource')}</p>
      <p>{t('support.invite')}</p>
      <p>
        <ExternalLink href={PAYPAL_DONATION_URL} className="info-support__button">
          <img src={paypalLogo} alt="" width="64" height="16" />
          <span>{t('support.button')}</span>
        </ExternalLink>
      </p>
      <p className="info-overlay__note">{t('support.note')}</p>
    </section>
  );
}
