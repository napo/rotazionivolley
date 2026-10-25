import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { APP_VERSION } from '../version';
import { isAndroidDevice, isInstalledPwa, isIosDevice, isWebPlatform } from '../platform';
import { isNativeBuild, setUpdateChecksEnabled, updateChecksEnabled } from '../update/updates';
import { ExternalLink } from '../ExternalLink';
import { PAYPAL_DONATION_URL, SOURCE_REPOSITORY_URL, releaseDownloads } from '../links';
import { setVertexRemovalConfirmEnabled, vertexRemovalConfirmEnabled } from '../zones/zonePreferences';
import paypalLogo from './paypal.svg';
import './info.css';

interface InfoPanelProps {
  onClose: () => void;
}

/**
 * The Info page: a full view in place of the court (like the editor), so the
 * text has room to be read — about the project, the preferences kept on this
 * device, the installers and the donation, as cards side by side on wide
 * screens and stacked on narrow ones.
 */
export function InfoPanel({ onClose }: InfoPanelProps) {
  const { t } = useI18n();
  // Only the plain web build needs pointers to the native installers — a
  // desktop/mobile build is itself one of those installers already.
  const [showDownloads] = useState(isWebPlatform);
  // iPhone/iPad in Safari: there's no native iOS build to download, the
  // app installs from the browser instead (PWA, see vite.config.ts).
  const [showIosInstall] = useState(() => isWebPlatform() && isIosDevice() && !isInstalledPwa());
  // Android in the browser: the same PWA installs from Chrome, as an
  // alternative to sideloading the APK.
  const [showAndroidInstall] = useState(() => isWebPlatform() && isAndroidDevice() && !isInstalledPwa());
  // Only the installed apps ever check for updates — see update/updates.ts.
  const [showUpdatesToggle] = useState(isNativeBuild);
  const [checksEnabled, setChecksEnabled] = useState(updateChecksEnabled);
  // Turned off from the "delete this point?" dialog of the competence map (see zones/VertexRemovalDialog).
  const [confirmVertexRemoval, setConfirmVertexRemoval] = useState(vertexRemovalConfirmEnabled);
  const showInstall = showDownloads || showIosInstall || showAndroidInstall;

  return (
    <div className="info-page">
      <header className="info-page__header">
        <button type="button" className="info-page__back" onClick={onClose}>
          {t('info.back')}
        </button>
        <h2>{t('info.title')}</h2>
      </header>

      <div className="info-page__grid">
        <section className="info-page__card" aria-labelledby="info-about-title">
          <h3 id="info-about-title">{t('info.about')}</h3>
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
              GNU Affero General Public License v3.0 or later
            </ExternalLink>
          </p>
        </section>

        <section className="info-page__card" aria-labelledby="info-preferences-title">
          <h3 id="info-preferences-title">{t('info.preferences')}</h3>
          <p>{t('info.schemesLocal')}</p>
          <p>
            <label className="info-page__check">
              <input
                type="checkbox"
                checked={confirmVertexRemoval}
                onChange={(e) => {
                  setConfirmVertexRemoval(e.target.checked);
                  setVertexRemovalConfirmEnabled(e.target.checked);
                }}
              />
              {t('info.zonesConfirmRemoval')}
            </label>
          </p>
          {showUpdatesToggle && (
            <p>
              <label className="info-page__check">
                <input
                  type="checkbox"
                  checked={checksEnabled}
                  onChange={(e) => {
                    setChecksEnabled(e.target.checked);
                    setUpdateChecksEnabled(e.target.checked);
                  }}
                />
                {t('info.updatesCheck')}
              </label>
            </p>
          )}
        </section>

        {showInstall && (
          <section className="info-page__card" aria-labelledby="info-install-title">
            <h3 id="info-install-title">{t('info.install')}</h3>
            {showIosInstall && <p>{t('update.iosInstallHint')}</p>}
            {showAndroidInstall && <p>{t('info.androidInstallHint')}</p>}
            {showDownloads && (
              <>
                <p>{t('info.downloads.intro', { version: APP_VERSION })}</p>
                <ul className="info-downloads">
                  {releaseDownloads(APP_VERSION).map(({ label, href }) => (
                    <li key={href}>
                      <ExternalLink href={href}>{label}</ExternalLink>
                    </li>
                  ))}
                </ul>
                <p className="info-page__note">
                  {t('info.downloads.allReleases')}{' '}
                  <ExternalLink href={`${SOURCE_REPOSITORY_URL}/releases`}>GitHub Releases</ExternalLink>
                </p>
                <p className="info-page__note">{t('info.downloads.macNotarizationNote')}</p>
                <p className="info-page__note">{t('info.downloads.androidSideloadNote')}</p>
              </>
            )}
          </section>
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
    <section className="info-page__card info-support" aria-labelledby="info-support-title">
      <h3 id="info-support-title">{t('support.title')}</h3>
      <p>{t('support.openSource')}</p>
      <p>{t('support.invite')}</p>
      <p>
        <ExternalLink href={PAYPAL_DONATION_URL} className="info-support__button">
          <img src={paypalLogo} alt="" width="64" height="16" />
          <span>{t('support.button')}</span>
        </ExternalLink>
      </p>
      <p className="info-page__note">{t('support.note')}</p>
    </section>
  );
}
