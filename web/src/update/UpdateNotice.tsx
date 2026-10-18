import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { APP_VERSION } from '../version';
import {
  checkForUpdate,
  compareVersions,
  installUpdate,
  isNativeBuild,
  swapLastVersion,
  updateChecksEnabled,
  type UpdateInfo,
} from './updates';
import './update.css';

/** Same donation page as the author's other apps (e.g. volleyreportxls) — a plain link, PayPal is contacted only when the user opens it. */
const DONATION_URL = 'https://paypal.me/MNapolitano570';

/**
 * Banner shown only in the installed apps (desktop/Android/iOS — see
 * isNativeBuild): tells the user a newer release exists — on desktop, with a
 * button that downloads, verifies and installs it in place (Tauri's
 * updater); on Android/iOS, with a link to get it by hand, since neither
 * Capacitor nor Tauri auto-updates mobile. Right after an update, it also
 * thanks the user once and invites a donation. The web build is always the
 * latest already, so it never shows either one.
 */
export function UpdateNotice() {
  const { t } = useI18n();
  const native = isNativeBuild();
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installState, setInstallState] = useState<'idle' | 'installing' | 'error'>('idle');
  const [progress, setProgress] = useState<number | null>(null);
  const [justUpdated, setJustUpdated] = useState(() => {
    if (!native) return false;
    const previous = swapLastVersion(APP_VERSION);
    return previous !== null && compareVersions(APP_VERSION, previous) > 0;
  });

  useEffect(() => {
    if (!native || !updateChecksEnabled()) return;
    let active = true;
    // Offline or GitHub unreachable: silently nothing, same as no update found.
    checkForUpdate(APP_VERSION)
      .then((found) => active && setUpdate(found))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [native]);

  if (!native) return null;

  const donateLink = (
    <a className="update-notice__btn update-notice__btn--secondary" href={DONATION_URL} target="_blank" rel="noreferrer">
      {t('update.donate')}
    </a>
  );

  if (justUpdated) {
    return (
      <div className="update-notice" role="status" aria-live="polite">
        <p>
          <strong>{t('update.updated', { version: APP_VERSION })}</strong> {t('update.support')}
        </p>
        <div className="update-notice__actions">
          {donateLink}
          <button type="button" className="update-notice__btn update-notice__btn--secondary" onClick={() => setJustUpdated(false)}>
            {t('update.close')}
          </button>
        </div>
      </div>
    );
  }

  if (!update || dismissed) return null;

  const install = async () => {
    if (update.kind === 'mobile') return; // handled by the <a href> below instead
    setInstallState('installing');
    try {
      await installUpdate(update, setProgress);
      // installUpdate relaunches the app on success — nothing left to render.
    } catch {
      setInstallState('error');
    }
  };

  const installing = installState === 'installing';
  const progressLabel =
    installing && (progress === null ? t('update.downloading') : progress < 1 ? t('update.progress', { percent: Math.round(progress * 100) }) : t('update.installing'));

  return (
    <div className="update-notice" role="status" aria-live="polite">
      <p>
        {t('update.available', { version: update.version, current: APP_VERSION })}
        {progressLabel && ` ${progressLabel}`}
        {installState === 'error' && ` ${t('update.failed')}`}
      </p>
      <div className="update-notice__actions">
        {update.kind === 'desktop' ? (
          <button type="button" className="update-notice__btn" disabled={installing} onClick={install}>
            {t('update.updateNow')}
          </button>
        ) : (
          <a className="update-notice__btn" href={update.url} target="_blank" rel="noreferrer">
            {t('update.download')}
          </a>
        )}
        {donateLink}
        <button
          type="button"
          className="update-notice__btn update-notice__btn--secondary"
          disabled={installing}
          onClick={() => setDismissed(true)}
        >
          {t('update.later')}
        </button>
      </div>
    </div>
  );
}
